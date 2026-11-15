"""gRPC servicer implementation for ForecastService."""
from __future__ import annotations

import hashlib
import time

import grpc
import numpy as np

from gen.kairos.forecast.v1 import forecast_pb2 as pb
from gen.kairos.forecast.v1 import forecast_pb2_grpc as pb_grpc
from kairos_ml import config, db, forecast as fc


def _proto_status(status: str) -> int:
    return {
        "ok": pb.RUN_STATUS_OK,
        "degraded": pb.RUN_STATUS_DEGRADED,
        "failed": pb.RUN_STATUS_FAILED,
    }.get(status, pb.RUN_STATUS_UNSPECIFIED)


def _proto_tier(tier: str) -> int:
    return {
        "full": pb.RELIABILITY_TIER_FULL,
        "low": pb.RELIABILITY_TIER_LOW,
        "insufficient": pb.RELIABILITY_TIER_INSUFFICIENT,
    }.get(tier, pb.RELIABILITY_TIER_UNSPECIFIED)


class ForecastService(pb_grpc.ForecastServiceServicer):
    """Transport handler mapping gRPC requests to db and forecast modules."""

    def ListInstruments(self, request: pb.ListInstrumentsRequest, context: grpc.ServicerContext) -> pb.ListInstrumentsResponse:
        rid = config.extract_request_id(context)
        config.log("info", "ListInstruments", only_active=request.only_active, request_id=rid)
        rows = db.fetch_instruments(request.only_active)
        return pb.ListInstrumentsResponse(
            instruments=[
                pb.Instrument(
                    instrument_id=r[0],
                    symbol=r[1],
                    mic=r[2],
                    currency=r[3],
                    timezone=r[4],
                    status=r[5],
                    reliability_tier=_proto_tier(r[6]),
                )
                for r in rows
            ]
        )

    def GetForecast(self, request: pb.GetForecastRequest, context: grpc.ServicerContext) -> pb.GetForecastResponse:
        rid = config.extract_request_id(context)
        inst_id = request.instrument_id or "IDX:TLKM"
        h = request.horizon_days or 7
        config.log("info", "GetForecast", instrument_id=inst_id, h=h, request_id=rid)

        row = db.fetch_latest_forecast(inst_id, h)
        if not row:
            context.set_code(grpc.StatusCode.NOT_FOUND)
            context.set_details(f"forecast not found for {inst_id} h={h}")
            return pb.GetForecastResponse()

        (
            r_inst,
            r_h,
            as_of_date,
            run_status,
            rel_tier,
            median,
            lower80,
            upper80,
            lower95,
            upper95,
            vol_daily,
            vol_annual,
            prob_corr,
            garch_raw,
            emp_raw,
            path_raw,
            created_at,
        ) = row

        garch_params = db.loads_json(garch_raw)
        emp_q = db.loads_json(emp_raw)
        path_list = db.loads_json(path_raw) if path_raw else []

        last_price = float(emp_q.get("last_price", median))
        theta = float(emp_q.get("theta", 0.05))
        base_rate = float(emp_q.get("rolling_base_rate", 0.0))
        vol_lower = float(garch_params.get("vol_lower", vol_annual * 0.8))
        vol_upper = float(garch_params.get("vol_upper", vol_annual * 1.2))
        created_iso = created_at.isoformat() if hasattr(created_at, "isoformat") else str(created_at)

        return pb.GetForecastResponse(
            instrument_id=r_inst,
            horizon_days=int(r_h),
            as_of_date=as_of_date,
            status=_proto_status(run_status),
            reliability_tier=_proto_tier(rel_tier),
            last_price=last_price,
            median=float(median),
            lower80=float(lower80),
            upper80=float(upper80),
            lower95=float(lower95),
            upper95=float(upper95),
            volatility=pb.Volatility(
                daily=float(vol_daily),
                annualized=float(vol_annual),
                lower=vol_lower,
                upper=vol_upper,
            ),
            correction=pb.CorrectionProbability(
                theta=theta,
                probability=float(prob_corr),
                rolling_base_rate=base_rate,
            ),
            path=[
                pb.PathPoint(
                    step=int(p["step"]),
                    median=float(p["median"]),
                    lower80=float(p["lower80"]),
                    upper80=float(p["upper80"]),
                    lower95=float(p["lower95"]),
                    upper95=float(p["upper95"]),
                )
                for p in path_list
            ],
            last_successful_update=created_iso,
        )

    def GetHistory(self, request: pb.GetHistoryRequest, context: grpc.ServicerContext) -> pb.GetHistoryResponse:
        rid = config.extract_request_id(context)
        inst_id = request.instrument_id or "IDX:TLKM"
        config.log("info", "GetHistory", instrument_id=inst_id, request_id=rid)

        price_rows, bt_rows = db.fetch_history(inst_id)
        if not price_rows:
            context.set_code(grpc.StatusCode.NOT_FOUND)
            context.set_details(f"no history found for {inst_id}")
            return pb.GetHistoryResponse()

        return pb.GetHistoryResponse(
            instrument_id=inst_id,
            actual=[pb.ActualPoint(date=r[0], close=float(r[1])) for r in price_rows],
            backtest=[
                pb.BacktestPoint(
                    as_of_date=r[0],
                    horizon_days=int(r[1]),
                    median=float(r[2]),
                    lower80=float(r[3]),
                    upper80=float(r[4]),
                )
                for r in bt_rows
            ],
        )

    def ComputeForecast(self, request: pb.ComputeForecastRequest, context: grpc.ServicerContext) -> pb.ComputeForecastResponse:
        t0 = time.time()
        rid = config.extract_request_id(context)
        inst_id = request.instrument_id
        config.log(
            "info",
            "ComputeForecast.start",
            instrument_id=inst_id,
            as_of_date=request.as_of_date,
            backfill=request.backfill,
            request_id=rid,
        )

        with db.get_conn() as conn, conn.cursor() as cur:
            inst_row, burn_in, thetas, price_rows = db.fetch_instrument_specs_and_prices(
                cur, inst_id, config.SPEC_VERSION, request.as_of_date
            )
            if not inst_row:
                context.set_code(grpc.StatusCode.NOT_FOUND)
                context.set_details(f"unknown instrument: {inst_id}")
                return pb.ComputeForecastResponse(
                    instrument_id=inst_id,
                    status=pb.RUN_STATUS_FAILED,
                    horizons_written=0,
                    message=f"unknown instrument: {inst_id}",
                )
            _, rel_tier = inst_row

            post_burn = price_rows[burn_in:]
            if len(post_burn) < fc.INIT + 1:
                dur_ms = int((time.time() - t0) * 1000)
                as_of_fallback = post_burn[-1][0] if post_burn else (request.as_of_date or "1970-01-01")
                db.mark_insufficient_data(
                    cur, inst_id, as_of_fallback, config.SPEC_VERSION, config.GIT_SHA, len(post_burn), dur_ms
                )
                conn.commit()
                return pb.ComputeForecastResponse(
                    instrument_id=inst_id,
                    status=pb.RUN_STATUS_FAILED,
                    horizons_written=0,
                    message=f"insufficient history after burn-in: {len(post_burn)} rows",
                )

            dates = [r[0] for r in post_burn]
            adj_closes = np.array([float(r[1]) for r in post_burn], dtype=float)
            returns = np.diff(np.log(adj_closes))
            ret_dates = dates[1:]
            ret_prices = adj_closes[1:]

            if not thetas:
                thetas = fc.default_thetas(returns, fc.HS)
                db.ensure_m3_specs(cur, inst_id, config.SPEC_VERSION, thetas, burn_in, rel_tier)

            if request.backfill:
                wf_origins = list(range(fc.INIT - 1, len(returns) - 1, fc.STEP))
                if (len(returns) - 1) not in wf_origins:
                    wf_origins.append(len(returns) - 1)
            else:
                wf_origins = [len(returns) - 1]

            horizons_written = 0
            latest_status = "ok"
            start_date = dates[0]

            for idx_i in wf_origins:
                origin_t0 = time.time()
                origin_date = ret_dates[idx_i]
                x_slice = returns[: idx_i + 1]
                last_price = float(ret_prices[idx_i])
                is_latest = idx_i == wf_origins[-1]

                res_by_h = fc.fit_origin(
                    x_slice,
                    last_price,
                    horizons=fc.HS,
                    thetas=thetas,
                    reliability_tier=rel_tier,
                    include_path=is_latest,
                )
                run_status = res_by_h[7]["status"]
                if is_latest:
                    latest_status = run_status

                data_hash = hashlib.sha256(x_slice.tobytes()).hexdigest()[:12]
                data_window = f"{start_date}..{origin_date} (n={len(x_slice)}, hash={data_hash})"
                origin_dur_ms = int((time.time() - origin_t0) * 1000)

                horizons_written += db.upsert_forecast_origin(
                    cur,
                    inst_id,
                    origin_date,
                    config.SPEC_VERSION,
                    config.GIT_SHA,
                    data_window,
                    run_status,
                    origin_dur_ms,
                    res_by_h,
                )

            conn.commit()

        total_ms = int((time.time() - t0) * 1000)
        config.log(
            "info",
            "ComputeForecast.done",
            instrument_id=inst_id,
            origins=len(wf_origins),
            horizons_written=horizons_written,
            status=latest_status,
            duration_ms=total_ms,
            request_id=rid,
        )
        return pb.ComputeForecastResponse(
            instrument_id=inst_id,
            status=_proto_status(latest_status),
            horizons_written=horizons_written,
            message=f"computed {len(wf_origins)} origin(s), as_of={ret_dates[wf_origins[-1]]}",
        )

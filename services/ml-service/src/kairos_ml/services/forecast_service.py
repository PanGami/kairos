"""Forecast querying and batch computation orchestration for ml-service."""
from __future__ import annotations

import hashlib
import time
from typing import Any

import numpy as np

from kairos_ml import config, db, forecast as fc


def get_forecast(inst_id: str, horizon_days: int) -> dict[str, Any] | None:
    """Fetch and parse the latest persisted forecast for an instrument and horizon."""
    row = db.fetch_latest_forecast(inst_id, horizon_days)
    if not row:
        return None

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
    vol_annual_f = float(vol_annual)

    return {
        "instrument_id": r_inst,
        "horizon_days": int(r_h),
        "as_of_date": as_of_date,
        "status": run_status,
        "reliability_tier": rel_tier,
        "last_price": float(emp_q.get("last_price", median)),
        "median": float(median),
        "lower80": float(lower80),
        "upper80": float(upper80),
        "lower95": float(lower95),
        "upper95": float(upper95),
        "volatility": {
            "daily": float(vol_daily),
            "annualized": vol_annual_f,
            "lower": float(garch_params.get("vol_lower", vol_annual_f * 0.8)),
            "upper": float(garch_params.get("vol_upper", vol_annual_f * 1.2)),
        },
        "correction": {
            "theta": float(emp_q.get("theta", 0.05)),
            "probability": float(prob_corr),
            "rolling_base_rate": float(emp_q.get("rolling_base_rate", 0.0)),
        },
        "path": path_list,
        "last_successful_update": created_at.isoformat() if hasattr(created_at, "isoformat") else str(created_at),
    }


def get_history(inst_id: str) -> tuple[list[tuple], list[tuple]]:
    """Fetch actual daily prices and historical walk-forward backtest rows."""
    return db.fetch_history(inst_id)


def compute_forecast(inst_id: str, as_of_date: str, backfill: bool, request_id: str = "") -> dict[str, Any]:
    """Run batch M1/M2/M3 fitting for one instrument across latest or walk-forward origins."""
    t0 = time.time()
    config.log(
        "info",
        "ComputeForecast.start",
        instrument_id=inst_id,
        as_of_date=as_of_date,
        backfill=backfill,
        request_id=request_id,
    )

    with db.get_conn() as conn, conn.cursor() as cur:
        inst_row, burn_in, thetas, price_rows = db.fetch_instrument_specs_and_prices(
            cur, inst_id, config.SPEC_VERSION, as_of_date
        )
        if not inst_row:
            return {
                "found": False,
                "status": "failed",
                "horizons_written": 0,
                "message": f"unknown instrument: {inst_id}",
            }
        _, rel_tier = inst_row

        post_burn = price_rows[burn_in:]
        if len(post_burn) < fc.INIT + 1:
            dur_ms = int((time.time() - t0) * 1000)
            as_of_fallback = post_burn[-1][0] if post_burn else (as_of_date or "1970-01-01")
            db.mark_insufficient_data(
                cur, inst_id, as_of_fallback, config.SPEC_VERSION, config.GIT_SHA, len(post_burn), dur_ms
            )
            conn.commit()
            return {
                "found": True,
                "status": "failed",
                "horizons_written": 0,
                "message": f"insufficient history after burn-in: {len(post_burn)} rows",
            }

        dates = [r[0] for r in post_burn]
        adj_closes = np.array([float(r[1]) for r in post_burn], dtype=float)
        returns = np.diff(np.log(adj_closes))
        ret_dates = dates[1:]
        ret_prices = adj_closes[1:]

        if not thetas:
            thetas = fc.default_thetas(returns, fc.HS)
            db.ensure_m3_specs(cur, inst_id, config.SPEC_VERSION, thetas, burn_in, rel_tier)

        if backfill:
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
        request_id=request_id,
    )
    return {
        "found": True,
        "status": latest_status,
        "horizons_written": horizons_written,
        "message": f"computed {len(wf_origins)} origin(s), as_of={ret_dates[wf_origins[-1]]}",
    }

"""Thin gRPC servicer mapping proto requests/responses to domain services."""
from __future__ import annotations

import grpc

from gen.kairos.forecast.v1 import forecast_pb2 as pb
from gen.kairos.forecast.v1 import forecast_pb2_grpc as pb_grpc
from kairos_ml import config
from kairos_ml.services import forecast_service, instrument_service


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
    """Thin gRPC transport handler delegating to kairos_ml.services."""

    def ListInstruments(self, request: pb.ListInstrumentsRequest, context: grpc.ServicerContext) -> pb.ListInstrumentsResponse:
        rid = config.extract_request_id(context)
        config.log("info", "ListInstruments", only_active=request.only_active, request_id=rid)
        rows = instrument_service.list_instruments(request.only_active)
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

        fc_data = forecast_service.get_forecast(inst_id, h)
        if not fc_data:
            context.set_code(grpc.StatusCode.NOT_FOUND)
            context.set_details(f"forecast not found for {inst_id} h={h}")
            return pb.GetForecastResponse()

        vol = fc_data["volatility"]
        corr = fc_data["correction"]
        return pb.GetForecastResponse(
            instrument_id=fc_data["instrument_id"],
            horizon_days=fc_data["horizon_days"],
            as_of_date=fc_data["as_of_date"],
            status=_proto_status(fc_data["status"]),
            reliability_tier=_proto_tier(fc_data["reliability_tier"]),
            last_price=fc_data["last_price"],
            median=fc_data["median"],
            lower80=fc_data["lower80"],
            upper80=fc_data["upper80"],
            lower95=fc_data["lower95"],
            upper95=fc_data["upper95"],
            volatility=pb.Volatility(
                daily=vol["daily"],
                annualized=vol["annualized"],
                lower=vol["lower"],
                upper=vol["upper"],
            ),
            correction=pb.CorrectionProbability(
                theta=corr["theta"],
                probability=corr["probability"],
                rolling_base_rate=corr["rolling_base_rate"],
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
                for p in fc_data["path"]
            ],
            last_successful_update=fc_data["last_successful_update"],
        )

    def GetHistory(self, request: pb.GetHistoryRequest, context: grpc.ServicerContext) -> pb.GetHistoryResponse:
        rid = config.extract_request_id(context)
        inst_id = request.instrument_id or "IDX:TLKM"
        config.log("info", "GetHistory", instrument_id=inst_id, request_id=rid)

        price_rows, bt_rows = forecast_service.get_history(inst_id)
        if not price_rows:
            context.set_code(grpc.StatusCode.NOT_FOUND)
            context.set_details(f"no history found for {inst_id}")
            return pb.GetHistoryResponse()

        return pb.GetHistoryResponse(
            instrument_id=inst_id,
            actual=[
                pb.ActualPoint(
                    date=r[0],
                    close=float(r[1]),
                    open=float(r[2]),
                    high=float(r[3]),
                    low=float(r[4]),
                    volume=int(r[5]),
                )
                for r in price_rows
            ],
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
        rid = config.extract_request_id(context)
        inst_id = request.instrument_id
        res = forecast_service.compute_forecast(inst_id, request.as_of_date, request.backfill, request_id=rid)
        if not res["found"]:
            context.set_code(grpc.StatusCode.NOT_FOUND)
            context.set_details(res["message"])
        return pb.ComputeForecastResponse(
            instrument_id=inst_id,
            status=_proto_status(res["status"]),
            horizons_written=res["horizons_written"],
            message=res["message"],
        )

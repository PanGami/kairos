"""Inter-service gRPC client for communicating with ml-service."""
from __future__ import annotations

import grpc

from kairos_ingestion import config, db

try:
    from gen.kairos.forecast.v1 import forecast_pb2 as pb
    from gen.kairos.forecast.v1 import forecast_pb2_grpc as pb_grpc
except ImportError:  # pragma: no cover
    pb = None  # type: ignore
    pb_grpc = None  # type: ignore


def trigger_forecasts(active_instruments: list[tuple[str, str, str, str, str]]) -> None:
    """Trigger ComputeForecast on ml-service for all active instruments."""
    if pb is None or pb_grpc is None:
        return
    with grpc.insecure_channel(config.ML_SERVICE_ADDR) as channel:
        grpc.channel_ready_future(channel).result(timeout=30.0)
        stub = pb_grpc.ForecastServiceStub(channel)
        for inst_id, *_ in active_instruments:
            backfill = config.FORCE_BACKFILL or db.needs_backfill(inst_id)
            try:
                resp = stub.ComputeForecast(
                    pb.ComputeForecastRequest(
                        instrument_id=inst_id,
                        as_of_date="",
                        backfill=backfill,
                    ),
                    timeout=120.0,
                )
                config.log(
                    "info",
                    "ComputeForecast triggered",
                    instrument_id=inst_id,
                    backfill=backfill,
                    status=int(resp.status),
                    horizons_written=resp.horizons_written,
                    message=resp.message,
                )
            except Exception as exc:
                config.log("error", "ComputeForecast failed", instrument_id=inst_id, err=str(exc))

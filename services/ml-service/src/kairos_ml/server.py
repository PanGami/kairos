"""KAIROS ml-service: gRPC server (stub tahap hello-world).

Tahap ini hanya membuktikan rantai gateway -> ml-service (gRPC) -> Postgres hidup.
Implementasi fit GARCH-t + interval empiris + M3 vol-implied menyusul (SR-04),
sebagai SALINAN TERPISAH dari notebook di ml/ (lihat AGENTS.md), dijaga golden test.
"""
from __future__ import annotations

import json
import logging
import os
import signal
import sys
import time
from concurrent import futures

import grpc
from grpc_health.v1 import health, health_pb2, health_pb2_grpc

# Stub digenerate saat build (buf/grpcio-tools) ke paket gen/ — lihat Dockerfile.
from gen.kairos.forecast.v1 import forecast_pb2 as pb
from gen.kairos.forecast.v1 import forecast_pb2_grpc as pb_grpc


def _log(level: str, msg: str, **kv) -> None:
    """Log JSON ke stdout (12-factor)."""
    rec = {"ts": time.time(), "level": level, "svc": "ml-service", "msg": msg, **kv}
    print(json.dumps(rec), flush=True)


class ForecastService(pb_grpc.ForecastServiceServicer):
    """Stub: mengembalikan nilai dummy berlabel DEGRADED agar jelas belum nyata."""

    def GetForecast(self, request: pb.GetForecastRequest, context) -> pb.GetForecastResponse:
        _log("info", "GetForecast", instrument_id=request.instrument_id, h=request.horizon_days)
        return pb.GetForecastResponse(
            instrument_id=request.instrument_id or "IDX:TLKM",
            horizon_days=request.horizon_days or 7,
            as_of_date="1970-01-01",
            status=pb.RUN_STATUS_DEGRADED,  # jujur: ini belum hasil fit nyata
            reliability_tier=pb.RELIABILITY_TIER_FULL,
            last_price=0.0,
            median=0.0,
            last_successful_update="",
        )

    def ListInstruments(self, request: pb.ListInstrumentsRequest, context) -> pb.ListInstrumentsResponse:
        _log("info", "ListInstruments", only_active=request.only_active)
        demo = [
            ("IDX:TLKM", "TLKM", pb.RELIABILITY_TIER_FULL),
            ("IDX:GOTO", "GOTO", pb.RELIABILITY_TIER_LOW),
            ("IDX:DCII", "DCII", pb.RELIABILITY_TIER_LOW),
        ]
        return pb.ListInstrumentsResponse(instruments=[
            pb.Instrument(instrument_id=i, symbol=s, mic="XIDX", currency="IDR",
                          timezone="Asia/Jakarta", status="active", reliability_tier=rt)
            for i, s, rt in demo
        ])

    def ComputeForecast(self, request: pb.ComputeForecastRequest, context) -> pb.ComputeForecastResponse:
        _log("info", "ComputeForecast", instrument_id=request.instrument_id, backfill=request.backfill)
        return pb.ComputeForecastResponse(
            instrument_id=request.instrument_id,
            status=pb.RUN_STATUS_DEGRADED,
            horizons_written=0,
            message="stub: fit belum diimplementasikan",
        )


def serve() -> None:
    port = os.environ.get("ML_SERVICE_PORT", "50051")
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=4))
    pb_grpc.add_ForecastServiceServicer_to_server(ForecastService(), server)

    # gRPC health protocol (dipakai readiness probe gateway/compose).
    health_servicer = health.HealthServicer()
    health_pb2_grpc.add_HealthServicer_to_server(health_servicer, server)
    health_servicer.set("", health_pb2.HealthCheckResponse.SERVING)
    health_servicer.set("kairos.forecast.v1.ForecastService",
                        health_pb2.HealthCheckResponse.SERVING)

    server.add_insecure_port(f"[::]:{port}")
    server.start()
    _log("info", "ml-service started", port=port)

    def _shutdown(signum, _frame):
        _log("info", "SIGTERM received, graceful shutdown", signum=signum)
        server.stop(grace=5).wait()
        sys.exit(0)

    signal.signal(signal.SIGTERM, _shutdown)
    signal.signal(signal.SIGINT, _shutdown)
    server.wait_for_termination()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    serve()

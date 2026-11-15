"""KAIROS ml-service bootstrap: gRPC server startup, health registration, and SIGTERM shutdown."""
from __future__ import annotations

from concurrent import futures
import logging
import signal
import sys

import grpc
from grpc_health.v1 import health, health_pb2, health_pb2_grpc

from gen.kairos.forecast.v1 import forecast_pb2_grpc as pb_grpc
from kairos_ml import config
from kairos_ml.servicer import ForecastService


def serve() -> None:
    port = config.ML_SERVICE_PORT
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=4))
    pb_grpc.add_ForecastServiceServicer_to_server(ForecastService(), server)

    health_servicer = health.HealthServicer()
    health_pb2_grpc.add_HealthServicer_to_server(health_servicer, server)
    health_servicer.set("", health_pb2.HealthCheckResponse.SERVING)
    health_servicer.set("kairos.forecast.v1.ForecastService", health_pb2.HealthCheckResponse.SERVING)

    server.add_insecure_port(f"[::]:{port}")
    server.start()
    config.log("info", "ml-service started", port=port)

    def _shutdown(signum, _frame):
        config.log("info", "SIGTERM received, graceful shutdown", signum=signum)
        server.stop(grace=5).wait()
        sys.exit(0)

    signal.signal(signal.SIGTERM, _shutdown)
    signal.signal(signal.SIGINT, _shutdown)
    server.wait_for_termination()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    serve()

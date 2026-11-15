"""KAIROS ml-service bootstrap: gRPC server startup, route registration, and SIGTERM shutdown."""
from __future__ import annotations

from concurrent import futures
import logging
import signal
import sys

import grpc

from kairos_ml import config
from kairos_ml.routes.forecast_routes import register_forecast_routes
from kairos_ml.routes.health_routes import register_health_routes


def serve() -> None:
    port = config.ML_SERVICE_PORT
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=4))
    register_forecast_routes(server)
    register_health_routes(server)

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

"""ForecastService gRPC route registration."""
from __future__ import annotations

import grpc

from gen.kairos.forecast.v1 import forecast_pb2_grpc as pb_grpc
from kairos_ml.servicer import ForecastService


def register_forecast_routes(server: grpc.Server) -> None:
    """Register ForecastService RPC handlers on the gRPC server."""
    pb_grpc.add_ForecastServiceServicer_to_server(ForecastService(), server)

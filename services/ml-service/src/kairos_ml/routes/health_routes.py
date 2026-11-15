"""gRPC health check route registration."""
from __future__ import annotations

import grpc
from grpc_health.v1 import health, health_pb2, health_pb2_grpc


def register_health_routes(server: grpc.Server) -> None:
    """Register gRPC health checking service and mark ForecastService as serving."""
    health_servicer = health.HealthServicer()
    health_pb2_grpc.add_HealthServicer_to_server(health_servicer, server)
    health_servicer.set("", health_pb2.HealthCheckResponse.SERVING)
    health_servicer.set("kairos.forecast.v1.ForecastService", health_pb2.HealthCheckResponse.SERVING)

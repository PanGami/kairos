package routes

import (
	"google.golang.org/grpc"
	"google.golang.org/grpc/health"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
)

func RegisterHealthRoutes(srv *grpc.Server) {
	hs := health.NewServer()
	healthpb.RegisterHealthServer(srv, hs)
	hs.SetServingStatus("", healthpb.HealthCheckResponse_SERVING)
	hs.SetServingStatus("kairos.auth.v1.AuthService", healthpb.HealthCheckResponse_SERVING)
}

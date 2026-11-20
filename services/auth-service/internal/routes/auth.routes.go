// Package routes registers gRPC services for auth-service.
package routes

import (
	"google.golang.org/grpc"

	authv1 "github.com/kairos/auth-service/gen/kairos/auth/v1"
)

func RegisterAuthRoutes(srv *grpc.Server, h authv1.AuthServiceServer) {
	authv1.RegisterAuthServiceServer(srv, h)
}

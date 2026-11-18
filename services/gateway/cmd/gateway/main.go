// KAIROS gateway bootstrap: wires gRPC clients, Redis cache, domain services, router, and HTTP server.
package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"syscall"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	authv1 "github.com/kairos/gateway/gen/kairos/auth/v1"
	forecastv1 "github.com/kairos/gateway/gen/kairos/forecast/v1"
	"github.com/kairos/gateway/internal/cache"
	"github.com/kairos/gateway/internal/handler"
	"github.com/kairos/gateway/internal/middleware"
	"github.com/kairos/gateway/internal/routes"
	"github.com/kairos/gateway/internal/services"
)

func env(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	mlAddr := env("ML_SERVICE_HOST", "ml-service") + ":" + env("ML_SERVICE_PORT", "50051")
	authAddr := env("AUTH_SERVICE_HOST", "auth-service") + ":" + env("AUTH_SERVICE_PORT", "50052")
	redisAddr := env("REDIS_HOST", "redis") + ":" + env("REDIS_PORT", "6379")
	rateLimit, _ := strconv.Atoi(env("RATE_LIMIT_PER_MIN", "120"))

	mlConn, err := grpc.NewClient(mlAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		slog.Error("dial ml-service", "err", err)
		os.Exit(1)
	}
	defer mlConn.Close()

	authConn, err := grpc.NewClient(authAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		slog.Error("dial auth-service", "err", err)
		os.Exit(1)
	}
	defer authConn.Close()

	mlClient := forecastv1.NewForecastServiceClient(mlConn)
	authClient := authv1.NewAuthServiceClient(authConn)
	redisCache := cache.New(redisAddr)

	devLogin := strings.EqualFold(env("AUTH_DEV_BYPASS", "false"), "true")
	authSvc := services.NewAuthService(authClient, os.Getenv("GOOGLE_CLIENT_ID"), devLogin)

	h := handler.New(
		services.NewInstrumentService(mlClient, redisCache),
		services.NewForecastService(mlClient, redisCache),
		authSvc,
		env("ADMIN_API_KEY", "change_me_admin_key"),
	)
	h.SetCookieSecure(strings.EqualFold(env("AUTH_COOKIE_SECURE", "false"), "true"))

	mux := routes.NewRouter(h, authSvc)

	addr := ":" + env("GATEWAY_PORT", "8080")
	srv := &http.Server{
		Addr:              addr,
		Handler:           middleware.Wrap(mux, middleware.NewRateLimiter(rateLimit)),
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		slog.Info("gateway started", "addr", addr, "ml", mlAddr, "auth", authAddr, "redis", redisAddr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("listen", "err", err)
			os.Exit(1)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGTERM, syscall.SIGINT)
	<-stop
	slog.Info("shutting down")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_ = srv.Shutdown(ctx)
}

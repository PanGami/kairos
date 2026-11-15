// KAIROS gateway bootstrap: wires gRPC client, Redis cache, domain services, router, and HTTP server.
package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

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
	redisAddr := env("REDIS_HOST", "redis") + ":" + env("REDIS_PORT", "6379")
	rateLimit, _ := strconv.Atoi(env("RATE_LIMIT_PER_MIN", "120"))

	conn, err := grpc.NewClient(mlAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		slog.Error("dial ml-service", "err", err)
		os.Exit(1)
	}
	defer conn.Close()

	mlClient := forecastv1.NewForecastServiceClient(conn)
	redisCache := cache.New(redisAddr)

	h := handler.New(
		services.NewInstrumentService(mlClient, redisCache),
		services.NewForecastService(mlClient, redisCache),
		env("ADMIN_API_KEY", "change_me_admin_key"),
	)

	mux := routes.NewRouter(h)

	addr := ":" + env("GATEWAY_PORT", "8080")
	srv := &http.Server{
		Addr:              addr,
		Handler:           middleware.Wrap(mux, middleware.NewRateLimiter(rateLimit)),
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		slog.Info("gateway started", "addr", addr, "ml", mlAddr, "redis", redisAddr)
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

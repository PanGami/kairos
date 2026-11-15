// KAIROS gateway: serves REST to the browser, calls ml-service via gRPC.
// Hello-world stage: /healthz, /readyz, /v1/instruments (proxied to ml-service).
package main

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	forecastv1 "github.com/kairos/gateway/gen/kairos/forecast/v1"
)

type server struct {
	ml forecastv1.ForecastServiceClient
}

func env(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

func (s *server) healthz(w http.ResponseWriter, _ *http.Request) {
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte("ok"))
}

func (s *server) readyz(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()
	// Readiness = ml-service is reachable.
	_, err := s.ml.ListInstruments(ctx, &forecastv1.ListInstrumentsRequest{OnlyActive: true})
	if err != nil {
		http.Error(w, "not ready: "+err.Error(), http.StatusServiceUnavailable)
		return
	}
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte("ready"))
}

func (s *server) listInstruments(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()
	resp, err := s.ml.ListInstruments(ctx, &forecastv1.ListInstrumentsRequest{OnlyActive: true})
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadGateway)
		return
	}
	out := map[string]any{"instruments": resp.GetInstruments()}
	w.Header().Set("Content-Type", "application/json")
	// Data changes once per day: cache aggressively (ADR-012).
	w.Header().Set("Cache-Control", "public, max-age=300")
	_ = json.NewEncoder(w).Encode(out)
}

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	mlAddr := env("ML_SERVICE_HOST", "ml-service") + ":" + env("ML_SERVICE_PORT", "50051")
	conn, err := grpc.NewClient(mlAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		slog.Error("dial ml-service", "err", err)
		os.Exit(1)
	}
	defer conn.Close()

	s := &server{ml: forecastv1.NewForecastServiceClient(conn)}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", s.healthz)
	mux.HandleFunc("GET /readyz", s.readyz)
	mux.HandleFunc("GET /v1/instruments", s.listInstruments)

	addr := ":" + env("GATEWAY_PORT", "8080")
	srv := &http.Server{Addr: addr, Handler: mux, ReadHeaderTimeout: 5 * time.Second}

	go func() {
		slog.Info("gateway started", "addr", addr, "ml", mlAddr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("listen", "err", err)
			os.Exit(1)
		}
	}()

	// graceful shutdown SIGTERM (AGENTS.md)
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGTERM, syscall.SIGINT)
	<-stop
	slog.Info("shutting down")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_ = srv.Shutdown(ctx)
}

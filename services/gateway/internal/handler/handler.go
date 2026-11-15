// Package handler implements thin HTTP route handlers delegating to internal/services.
package handler

import (
	"context"
	"crypto/sha1"
	"crypto/subtle"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"

	"github.com/kairos/gateway/internal/services"
)

type Handler struct {
	instruments *services.InstrumentService
	forecasts   *services.ForecastService
	adminKey    string
}

func New(inst *services.InstrumentService, fc *services.ForecastService, adminKey string) *Handler {
	return &Handler{instruments: inst, forecasts: fc, adminKey: adminKey}
}

func grpcCtx(r *http.Request, timeout time.Duration) (context.Context, context.CancelFunc) {
	ctx, cancel := context.WithTimeout(r.Context(), timeout)
	if rid := r.Header.Get("X-Request-Id"); rid != "" {
		ctx = metadata.AppendToOutgoingContext(ctx, "x-request-id", rid)
	}
	return ctx, cancel
}

func writeCachedJSON(w http.ResponseWriter, r *http.Request, body []byte) {
	sum := sha1.Sum(body)
	etag := fmt.Sprintf(`"%x"`, sum[:8])
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "public, max-age=300")
	w.Header().Set("ETag", etag)
	if r.Header.Get("If-None-Match") == etag {
		w.WriteHeader(http.StatusNotModified)
		return
	}
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(body)
}

func (h *Handler) Healthz(w http.ResponseWriter, _ *http.Request) {
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte("ok"))
}

func (h *Handler) Readyz(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := grpcCtx(r, 2*time.Second)
	defer cancel()
	if err := h.instruments.CheckReady(ctx); err != nil {
		http.Error(w, "not ready: "+err.Error(), http.StatusServiceUnavailable)
		return
	}
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte("ready"))
}

func (h *Handler) ListInstruments(w http.ResponseWriter, r *http.Request) {
	onlyActive := r.URL.Query().Get("only_active") != "false"
	ctx, cancel := grpcCtx(r, 3*time.Second)
	defer cancel()
	body, err := h.instruments.ListInstrumentsJSON(ctx, onlyActive)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadGateway)
		return
	}
	writeCachedJSON(w, r, body)
}

func (h *Handler) GetForecast(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	hStr := r.URL.Query().Get("h")
	if hStr == "" {
		hStr = "7"
	}
	horizon, err := strconv.Atoi(hStr)
	if err != nil || (horizon != 7 && horizon != 30) {
		http.Error(w, "query parameter h must be 7 or 30", http.StatusBadRequest)
		return
	}

	ctx, cancel := grpcCtx(r, 5*time.Second)
	defer cancel()
	body, err := h.forecasts.GetForecastJSON(ctx, id, horizon)
	if err != nil {
		if status.Code(err) == codes.NotFound {
			http.Error(w, "forecast not found", http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusBadGateway)
		return
	}
	writeCachedJSON(w, r, body)
}

func (h *Handler) GetHistory(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	ctx, cancel := grpcCtx(r, 5*time.Second)
	defer cancel()
	body, err := h.forecasts.GetHistoryJSON(ctx, id)
	if err != nil {
		if status.Code(err) == codes.NotFound {
			http.Error(w, "history not found", http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusBadGateway)
		return
	}
	writeCachedJSON(w, r, body)
}

func (h *Handler) AdminRefresh(w http.ResponseWriter, r *http.Request) {
	gotKey := r.Header.Get("X-Admin-Api-Key")
	if h.adminKey == "" || subtle.ConstantTimeCompare([]byte(gotKey), []byte(h.adminKey)) != 1 {
		http.Error(w, "invalid admin api key", http.StatusUnauthorized)
		return
	}

	ctx, cancel := grpcCtx(r, 60*time.Second)
	defer cancel()
	results, err := h.forecasts.RefreshAllActive(ctx)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadGateway)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	_ = json.NewEncoder(w).Encode(map[string]any{"refreshed": results})
}

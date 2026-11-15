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
	"strings"
	"time"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"

	"github.com/kairos/gateway/internal/middleware"
	"github.com/kairos/gateway/internal/services"
)

type Handler struct {
	instruments *services.InstrumentService
	forecasts   *services.ForecastService
	auth        *services.AuthService
	adminKey    string
}

func New(inst *services.InstrumentService, fc *services.ForecastService, auth *services.AuthService, adminKey string) *Handler {
	return &Handler{instruments: inst, forecasts: fc, auth: auth, adminKey: adminKey}
}

func grpcCtx(r *http.Request, timeout time.Duration) (context.Context, context.CancelFunc) {
	ctx, cancel := context.WithTimeout(r.Context(), timeout)
	if rid := r.Header.Get("X-Request-Id"); rid != "" {
		ctx = metadata.AppendToOutgoingContext(ctx, "x-request-id", rid)
	}
	return ctx, cancel
}

func writeJSON(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(v)
}

func writeCachedJSON(w http.ResponseWriter, r *http.Request, body []byte) {
	sum := sha1.Sum(body)
	etag := fmt.Sprintf(`"%x"`, sum[:8])
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "private, max-age=300")
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
	if err := h.auth.CheckReady(ctx); err != nil {
		http.Error(w, "not ready (auth-service): "+err.Error(), http.StatusServiceUnavailable)
		return
	}
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte("ready"))
}

func (h *Handler) AuthConfig(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, h.auth.Config())
}

func (h *Handler) AuthGoogle(w http.ResponseWriter, r *http.Request) {
	var body struct {
		IDToken string `json:"id_token"`
	}
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 64<<10)).Decode(&body); err != nil || strings.TrimSpace(body.IDToken) == "" {
		http.Error(w, "missing id_token", http.StatusBadRequest)
		return
	}

	ctx, cancel := grpcCtx(r, 8*time.Second)
	defer cancel()
	res, err := h.auth.SignInWithGoogle(ctx, body.IDToken)
	if err != nil {
		if status.Code(err) == codes.Unauthenticated {
			http.Error(w, "invalid google token", http.StatusUnauthorized)
			return
		}
		http.Error(w, err.Error(), http.StatusBadGateway)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     middleware.SessionCookieName,
		Value:    res.SessionToken,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   7 * 86400,
	})
	writeJSON(w, http.StatusOK, res)
}

func (h *Handler) AuthMe(w http.ResponseWriter, r *http.Request) {
	if user, ok := middleware.UserFromContext(r.Context()); ok {
		writeJSON(w, http.StatusOK, map[string]any{"user": user})
		return
	}
	token := middleware.ExtractSessionToken(r)
	if token == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	ctx, cancel := grpcCtx(r, 3*time.Second)
	defer cancel()
	user, valid, err := h.auth.ValidateSession(ctx, token)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadGateway)
		return
	}
	if !valid {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"user": user})
}

func (h *Handler) AuthLogout(w http.ResponseWriter, r *http.Request) {
	if token := middleware.ExtractSessionToken(r); token != "" {
		ctx, cancel := grpcCtx(r, 3*time.Second)
		defer cancel()
		if err := h.auth.SignOut(ctx, token); err != nil {
			http.Error(w, err.Error(), http.StatusBadGateway)
			return
		}
	}
	http.SetCookie(w, &http.Cookie{
		Name:     middleware.SessionCookieName,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
	})
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
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

	writeJSON(w, http.StatusAccepted, map[string]any{"refreshed": results})
}

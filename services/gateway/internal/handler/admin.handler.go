package handler

import (
	"crypto/subtle"
	"net/http"
	"time"

	"github.com/kairos/gateway/internal/middleware"
)

func (h *Handler) authorizeAdminRefresh(w http.ResponseWriter, r *http.Request) bool {
	if gotKey := r.Header.Get("X-Admin-Api-Key"); gotKey != "" {
		if h.adminKey == "" || subtle.ConstantTimeCompare([]byte(gotKey), []byte(h.adminKey)) != 1 {
			http.Error(w, "invalid admin api key", http.StatusUnauthorized)
			return false
		}
		return true
	}

	token := middleware.ExtractSessionToken(r)
	if token == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return false
	}
	ctx, cancel := grpcCtx(r, 3*time.Second)
	defer cancel()
	user, valid, err := h.auth.ValidateSession(ctx, token)
	if err != nil {
		http.Error(w, "auth check failed", http.StatusBadGateway)
		return false
	}
	if !valid {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return false
	}
	if user.Role != "admin" {
		writeJSON(w, http.StatusForbidden, map[string]any{
			"error": "Akses ditolak. Diperlukan hak akses admin.",
			"code":  "FORBIDDEN",
		})
		return false
	}
	return true
}

// AdminRefresh triggers synchronous Watcher ingestion and forecast updates via X-Admin-Api-Key or admin session.
func (h *Handler) AdminRefresh(w http.ResponseWriter, r *http.Request) {
	if !h.authorizeAdminRefresh(w, r) {
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

func (h *Handler) AdminListUsers(w http.ResponseWriter, r *http.Request) {
	token := middleware.ExtractSessionToken(r)
	search := r.URL.Query().Get("search")
	ctx, cancel := grpcCtx(r, 5*time.Second)
	defer cancel()
	users, err := h.auth.ListUsers(ctx, token, search)
	if err != nil {
		writeAuthError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"users": users})
}

func (h *Handler) AdminSetUserSuspended(w http.ResponseWriter, r *http.Request) {
	targetID := r.PathValue("id")
	var req struct {
		Suspended bool `json:"suspended"`
	}
	if !decodeJSON(w, r, &req) {
		return
	}
	token := middleware.ExtractSessionToken(r)
	ctx, cancel := grpcCtx(r, 5*time.Second)
	defer cancel()
	user, err := h.auth.SetUserSuspended(ctx, token, targetID, req.Suspended)
	if err != nil {
		writeAuthError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"user": user})
}

func (h *Handler) AdminRevokeUserSessions(w http.ResponseWriter, r *http.Request) {
	targetID := r.PathValue("id")
	token := middleware.ExtractSessionToken(r)
	ctx, cancel := grpcCtx(r, 5*time.Second)
	defer cancel()
	count, err := h.auth.RevokeUserSessions(ctx, token, targetID)
	if err != nil {
		writeAuthError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"revoked_count": count})
}

func (h *Handler) AdminDeleteUser(w http.ResponseWriter, r *http.Request) {
	targetID := r.PathValue("id")
	token := middleware.ExtractSessionToken(r)
	ctx, cancel := grpcCtx(r, 5*time.Second)
	defer cancel()
	if err := h.auth.DeleteUser(ctx, token, targetID); err != nil {
		writeAuthError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}

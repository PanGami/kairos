package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"google.golang.org/grpc/metadata"

	"github.com/kairos/gateway/internal/services"
)

const SessionCookieName = "kairos_session"

type userContextKey struct{}

// ExtractSessionToken reads an opaque session token from Authorization: Bearer or the session cookie.
func ExtractSessionToken(r *http.Request) string {
	authz := strings.TrimSpace(r.Header.Get("Authorization"))
	if len(authz) > 7 && strings.EqualFold(authz[:7], "Bearer ") {
		if tok := strings.TrimSpace(authz[7:]); tok != "" {
			return tok
		}
	}
	if c, err := r.Cookie(SessionCookieName); err == nil {
		return strings.TrimSpace(c.Value)
	}
	return ""
}

// UserFromContext returns the authenticated user stored by RequireAuth.
func UserFromContext(ctx context.Context) (services.UserDTO, bool) {
	u, ok := ctx.Value(userContextKey{}).(services.UserDTO)
	return u, ok
}

// RequireAuth validates the caller's session via auth-service before calling next.
func RequireAuth(authSvc *services.AuthService, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		token := ExtractSessionToken(r)
		if token == "" {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
		defer cancel()
		if rid := r.Header.Get("X-Request-Id"); rid != "" {
			ctx = metadata.AppendToOutgoingContext(ctx, "x-request-id", rid)
		}

		user, valid, err := authSvc.ValidateSession(ctx, token)
		if err != nil {
			http.Error(w, "auth service unavailable", http.StatusBadGateway)
			return
		}
		if !valid {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		next(w, r.WithContext(context.WithValue(r.Context(), userContextKey{}, user)))
	}
}

// RequireAdmin validates the caller's session via auth-service and requires role == "admin".
func RequireAdmin(authSvc *services.AuthService, next http.HandlerFunc) http.HandlerFunc {
	return RequireAuth(authSvc, func(w http.ResponseWriter, r *http.Request) {
		user, ok := UserFromContext(r.Context())
		if !ok || user.Role != "admin" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusForbidden)
			_ = json.NewEncoder(w).Encode(map[string]any{
				"error": "Akses ditolak. Diperlukan hak akses admin.",
				"code":  "FORBIDDEN",
			})
			return
		}
		next(w, r)
	})
}

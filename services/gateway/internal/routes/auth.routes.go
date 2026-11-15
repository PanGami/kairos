package routes

import (
	"net/http"

	"github.com/kairos/gateway/internal/handler"
	"github.com/kairos/gateway/internal/middleware"
	"github.com/kairos/gateway/internal/services"
)

func RegisterAuthRoutes(mux *http.ServeMux, h *handler.Handler, authSvc *services.AuthService) {
	mux.HandleFunc("GET /v1/auth/config", h.AuthConfig)
	mux.HandleFunc("POST /v1/auth/google", h.AuthGoogle)
	mux.HandleFunc("GET /v1/auth/me", middleware.RequireAuth(authSvc, h.AuthMe))
	mux.HandleFunc("POST /v1/auth/logout", h.AuthLogout)
}

package routes

import (
	"net/http"

	"github.com/kairos/gateway/internal/handler"
	"github.com/kairos/gateway/internal/middleware"
	"github.com/kairos/gateway/internal/services"
)

func RegisterAdminRoutes(mux *http.ServeMux, h *handler.Handler, authSvc *services.AuthService) {
	mux.HandleFunc("POST /v1/admin/refresh", h.AdminRefresh)
	mux.HandleFunc("GET /v1/admin/users", middleware.RequireAdmin(authSvc, h.AdminListUsers))
	mux.HandleFunc("POST /v1/admin/users/{id}/suspend", middleware.RequireAdmin(authSvc, h.AdminSetUserSuspended))
	mux.HandleFunc("POST /v1/admin/users/{id}/revoke-sessions", middleware.RequireAdmin(authSvc, h.AdminRevokeUserSessions))
	mux.HandleFunc("DELETE /v1/admin/users/{id}", middleware.RequireAdmin(authSvc, h.AdminDeleteUser))
}

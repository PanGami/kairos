package routes

import (
	"net/http"

	"github.com/kairos/gateway/internal/handler"
)

func RegisterAdminRoutes(mux *http.ServeMux, h *handler.Handler) {
	mux.HandleFunc("POST /v1/admin/refresh", h.AdminRefresh)
}

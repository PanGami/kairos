package routes

import (
	"net/http"

	"github.com/kairos/gateway/internal/handler"
)

func RegisterHealthRoutes(mux *http.ServeMux, h *handler.Handler) {
	mux.HandleFunc("GET /healthz", h.Healthz)
	mux.HandleFunc("GET /readyz", h.Readyz)
}

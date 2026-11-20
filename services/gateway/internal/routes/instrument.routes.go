package routes

import (
	"net/http"

	"github.com/kairos/gateway/internal/handler"
	"github.com/kairos/gateway/internal/services"
)

func RegisterInstrumentRoutes(mux *http.ServeMux, h *handler.Handler, _ *services.AuthService) {
	mux.HandleFunc("GET /v1/instruments", h.ListInstruments)
}

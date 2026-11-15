package routes

import (
	"net/http"

	"github.com/kairos/gateway/internal/handler"
)

func RegisterInstrumentRoutes(mux *http.ServeMux, h *handler.Handler) {
	mux.HandleFunc("GET /v1/instruments", h.ListInstruments)
}

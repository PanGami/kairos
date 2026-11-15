package routes

import (
	"net/http"

	"github.com/kairos/gateway/internal/handler"
)

func RegisterForecastRoutes(mux *http.ServeMux, h *handler.Handler) {
	mux.HandleFunc("GET /v1/instruments/{id}/forecast", h.GetForecast)
	mux.HandleFunc("GET /v1/instruments/{id}/history", h.GetHistory)
}

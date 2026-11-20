package routes

import (
	"net/http"

	"github.com/kairos/gateway/internal/handler"
	"github.com/kairos/gateway/internal/services"
)

func RegisterForecastRoutes(mux *http.ServeMux, h *handler.Handler, _ *services.AuthService) {
	mux.HandleFunc("GET /v1/instruments/{id}/forecast", h.GetForecast)
	mux.HandleFunc("GET /v1/instruments/{id}/history", h.GetHistory)
}

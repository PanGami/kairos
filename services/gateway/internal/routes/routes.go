// Package routes registers gateway HTTP routes split by domain.
package routes

import (
	"net/http"

	"github.com/kairos/gateway/internal/handler"
	"github.com/kairos/gateway/internal/services"
)

func NewRouter(h *handler.Handler, authSvc *services.AuthService) *http.ServeMux {
	mux := http.NewServeMux()
	RegisterHealthRoutes(mux, h)
	RegisterAuthRoutes(mux, h, authSvc)
	RegisterInstrumentRoutes(mux, h, authSvc)
	RegisterForecastRoutes(mux, h, authSvc)
	RegisterAdminRoutes(mux, h)
	return mux
}

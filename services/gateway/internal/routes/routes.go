// Package routes registers gateway HTTP routes split by domain.
package routes

import (
	"net/http"

	"github.com/kairos/gateway/internal/handler"
)

func NewRouter(h *handler.Handler) *http.ServeMux {
	mux := http.NewServeMux()
	RegisterHealthRoutes(mux, h)
	RegisterInstrumentRoutes(mux, h)
	RegisterForecastRoutes(mux, h)
	RegisterAdminRoutes(mux, h)
	return mux
}

package routes

import (
	"net/http"

	"github.com/kairos/gateway/internal/handler"
	"github.com/kairos/gateway/internal/middleware"
	"github.com/kairos/gateway/internal/services"
)

func RegisterAuthRoutes(mux *http.ServeMux, h *handler.Handler, authSvc *services.AuthService) {
	mux.HandleFunc("GET /v1/auth/config", h.AuthConfig)
	mux.HandleFunc("GET /v1/auth/google/state", h.AuthGoogleState)
	mux.HandleFunc("POST /v1/auth/google", h.AuthGoogle)
	mux.HandleFunc("POST /v1/auth/google/link", middleware.RequireAuth(authSvc, h.AuthLinkGoogle))
	mux.HandleFunc("POST /v1/auth/register", h.AuthRegister)
	mux.HandleFunc("POST /v1/auth/login", h.AuthLogin)
	mux.HandleFunc("POST /v1/auth/otp/verify", h.AuthVerifyOTP)
	mux.HandleFunc("POST /v1/auth/otp/resend", h.AuthResendOTP)
	mux.HandleFunc("POST /v1/auth/password/forgot", h.AuthForgotPassword)
	mux.HandleFunc("POST /v1/auth/password/reset", h.AuthResetPassword)
	mux.HandleFunc("GET /v1/auth/me", middleware.RequireAuth(authSvc, h.AuthMe))
	mux.HandleFunc("PATCH /v1/auth/profile", middleware.RequireAuth(authSvc, h.AuthUpdateProfile))
	mux.HandleFunc("POST /v1/auth/password/change", middleware.RequireAuth(authSvc, h.AuthChangePassword))
	mux.HandleFunc("POST /v1/auth/password/set/request-otp", middleware.RequireAuth(authSvc, h.AuthRequestSetPasswordOTP))
	mux.HandleFunc("POST /v1/auth/password/set", middleware.RequireAuth(authSvc, h.AuthSetPassword))
	mux.HandleFunc("POST /v1/auth/logout", h.AuthLogout)
}

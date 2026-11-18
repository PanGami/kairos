package handler

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/hex"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/kairos/gateway/internal/middleware"
	"github.com/kairos/gateway/internal/services"
)

const oauthStateCookieName = "kairos_oauth_state"

func (h *Handler) isSecureCookie(r *http.Request) bool {
	return h.cookieSecure || r.TLS != nil || strings.EqualFold(r.Header.Get("X-Forwarded-Proto"), "https")
}

func (h *Handler) setSessionCookie(w http.ResponseWriter, r *http.Request, token string, maxAge int) {
	http.SetCookie(w, &http.Cookie{
		Name:     middleware.SessionCookieName,
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   h.isSecureCookie(r),
		SameSite: http.SameSiteLaxMode,
		MaxAge:   maxAge,
	})
}

func decodeJSON(w http.ResponseWriter, r *http.Request, dst any) bool {
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 64<<10)).Decode(dst); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{
			"error": "Format permintaan tidak valid.",
			"code":  "BAD_REQUEST",
		})
		return false
	}
	return true
}

func writeAuthError(w http.ResponseWriter, err error) {
	var se *services.ServiceError
	if errors.As(err, &se) {
		payload := map[string]any{
			"error": se.Message,
			"code":  se.Code,
		}
		if se.Email != "" {
			payload["email"] = se.Email
		}
		if se.RetryAfter > 0 {
			payload["retry_after_seconds"] = se.RetryAfter
		}
		writeJSON(w, se.HTTPStatus, payload)
		return
	}
	writeJSON(w, http.StatusBadGateway, map[string]any{
		"error": err.Error(),
		"code":  "AUTH_UNAVAILABLE",
	})
}

func (h *Handler) checkAuthLimits(w http.ResponseWriter, r *http.Request, scope, email string) bool {
	if h.authLimiter == nil {
		return true
	}
	ip := middleware.ClientIP(r)
	if !h.authLimiter.Allow("ip:" + scope + ":" + ip) {
		writeJSON(w, http.StatusTooManyRequests, map[string]any{
			"error": "Terlalu banyak percobaan. Silakan tunggu beberapa menit.",
			"code":  "RATE_LIMITED",
		})
		return false
	}
	normEmail := strings.ToLower(strings.TrimSpace(email))
	if normEmail != "" && !h.authLimiter.Allow("email:"+scope+":"+normEmail) {
		writeJSON(w, http.StatusTooManyRequests, map[string]any{
			"error": "Terlalu banyak percobaan untuk email ini. Silakan tunggu beberapa menit.",
			"code":  "RATE_LIMITED",
		})
		return false
	}
	return true
}

func (h *Handler) AuthConfig(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, h.auth.Config())
}

func (h *Handler) AuthGoogleState(w http.ResponseWriter, r *http.Request) {
	var b [16]byte
	if _, err := rand.Read(b[:]); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": "gagal membuat state", "code": "INTERNAL"})
		return
	}
	state := hex.EncodeToString(b[:])
	http.SetCookie(w, &http.Cookie{
		Name:     oauthStateCookieName,
		Value:    state,
		Path:     "/",
		HttpOnly: true,
		Secure:   h.isSecureCookie(r),
		SameSite: http.SameSiteLaxMode,
		MaxAge:   600,
	})
	writeJSON(w, http.StatusOK, map[string]string{"state": state})
}

func (h *Handler) verifyAndClearOAuthState(w http.ResponseWriter, r *http.Request, state string) bool {
	stateCookie, cookieErr := r.Cookie(oauthStateCookieName)
	providedState := strings.TrimSpace(state)
	if cookieErr == nil || providedState != "" {
		if cookieErr != nil || providedState == "" || subtle.ConstantTimeCompare([]byte(stateCookie.Value), []byte(providedState)) != 1 {
			writeJSON(w, http.StatusBadRequest, map[string]any{"error": "State OAuth tidak valid. Silakan coba masuk lagi.", "code": "INVALID_OAUTH_STATE"})
			return false
		}
		http.SetCookie(w, &http.Cookie{
			Name:     oauthStateCookieName,
			Value:    "",
			Path:     "/",
			HttpOnly: true,
			Secure:   h.isSecureCookie(r),
			SameSite: http.SameSiteLaxMode,
			MaxAge:   -1,
		})
	}
	return true
}

func (h *Handler) AuthGoogle(w http.ResponseWriter, r *http.Request) {
	var body struct {
		IDToken string `json:"id_token"`
		State   string `json:"state"`
	}
	if !decodeJSON(w, r, &body) || strings.TrimSpace(body.IDToken) == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "missing id_token", "code": "BAD_REQUEST"})
		return
	}
	if !h.verifyAndClearOAuthState(w, r, body.State) {
		return
	}

	ctx, cancel := grpcCtx(r, 8*time.Second)
	defer cancel()
	res, err := h.auth.SignInWithGoogle(ctx, body.IDToken)
	if err != nil {
		writeAuthError(w, err)
		return
	}

	h.setSessionCookie(w, r, res.SessionToken, 7*86400)
	writeJSON(w, http.StatusOK, res)
}

func (h *Handler) AuthLinkGoogle(w http.ResponseWriter, r *http.Request) {
	token := middleware.ExtractSessionToken(r)
	if token == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	var body struct {
		IDToken string `json:"id_token"`
		State   string `json:"state"`
	}
	if !decodeJSON(w, r, &body) || strings.TrimSpace(body.IDToken) == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "missing id_token", "code": "BAD_REQUEST"})
		return
	}
	if !h.verifyAndClearOAuthState(w, r, body.State) {
		return
	}

	ctx, cancel := grpcCtx(r, 8*time.Second)
	defer cancel()
	user, err := h.auth.LinkGoogle(ctx, token, body.IDToken)
	if err != nil {
		writeAuthError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"user": user})
}

func (h *Handler) AuthRegister(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Name                 string `json:"name"`
		Email                string `json:"email"`
		Password             string `json:"password"`
		PasswordConfirmation string `json:"password_confirmation"`
	}
	if !decodeJSON(w, r, &body) {
		return
	}
	if !h.checkAuthLimits(w, r, "register", body.Email) {
		return
	}
	ctx, cancel := grpcCtx(r, 10*time.Second)
	defer cancel()
	res, err := h.auth.Register(ctx, body.Name, body.Email, body.Password, body.PasswordConfirmation)
	if err != nil {
		writeAuthError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, res)
}

func (h *Handler) AuthVerifyOTP(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email   string `json:"email"`
		Purpose string `json:"purpose"`
		Code    string `json:"code"`
	}
	if !decodeJSON(w, r, &body) {
		return
	}
	if !h.checkAuthLimits(w, r, "otp_verify", body.Email) {
		return
	}
	ctx, cancel := grpcCtx(r, 8*time.Second)
	defer cancel()
	res, err := h.auth.VerifyOTP(ctx, body.Email, body.Purpose, body.Code)
	if err != nil {
		writeAuthError(w, err)
		return
	}
	h.setSessionCookie(w, r, res.SessionToken, 7*86400)
	writeJSON(w, http.StatusOK, res)
}

func (h *Handler) AuthResendOTP(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email   string `json:"email"`
		Purpose string `json:"purpose"`
	}
	if !decodeJSON(w, r, &body) {
		return
	}
	if !h.checkAuthLimits(w, r, "otp_resend", body.Email) {
		return
	}
	ctx, cancel := grpcCtx(r, 10*time.Second)
	defer cancel()
	res, err := h.auth.ResendOTP(ctx, body.Email, body.Purpose)
	if err != nil {
		writeAuthError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, res)
}

func (h *Handler) AuthLogin(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if !decodeJSON(w, r, &body) {
		return
	}
	if !h.checkAuthLimits(w, r, "login", body.Email) {
		return
	}
	ctx, cancel := grpcCtx(r, 8*time.Second)
	defer cancel()
	res, err := h.auth.LoginWithPassword(ctx, body.Email, body.Password)
	if err != nil {
		writeAuthError(w, err)
		return
	}
	h.setSessionCookie(w, r, res.SessionToken, 7*86400)
	writeJSON(w, http.StatusOK, res)
}

func (h *Handler) AuthForgotPassword(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email string `json:"email"`
	}
	if !decodeJSON(w, r, &body) {
		return
	}
	if !h.checkAuthLimits(w, r, "forgot", body.Email) {
		return
	}
	ctx, cancel := grpcCtx(r, 10*time.Second)
	defer cancel()
	res, err := h.auth.ForgotPassword(ctx, body.Email)
	if err != nil {
		writeAuthError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, res)
}

func (h *Handler) AuthResetPassword(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email                string `json:"email"`
		Code                 string `json:"code"`
		NewPassword          string `json:"new_password"`
		PasswordConfirmation string `json:"password_confirmation"`
	}
	if !decodeJSON(w, r, &body) {
		return
	}
	if !h.checkAuthLimits(w, r, "reset", body.Email) {
		return
	}
	ctx, cancel := grpcCtx(r, 10*time.Second)
	defer cancel()
	if err := h.auth.ResetPassword(ctx, body.Email, body.Code, body.NewPassword, body.PasswordConfirmation); err != nil {
		writeAuthError(w, err)
		return
	}
	h.setSessionCookie(w, r, "", -1)
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (h *Handler) AuthMe(w http.ResponseWriter, r *http.Request) {
	if user, ok := middleware.UserFromContext(r.Context()); ok {
		writeJSON(w, http.StatusOK, map[string]any{"user": user})
		return
	}
	token := middleware.ExtractSessionToken(r)
	if token == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	ctx, cancel := grpcCtx(r, 3*time.Second)
	defer cancel()
	user, valid, err := h.auth.ValidateSession(ctx, token)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadGateway)
		return
	}
	if !valid {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"user": user})
}

func (h *Handler) AuthUpdateProfile(w http.ResponseWriter, r *http.Request) {
	token := middleware.ExtractSessionToken(r)
	if token == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	var body struct {
		Name      string `json:"name"`
		AvatarKey string `json:"avatar_key"`
	}
	if !decodeJSON(w, r, &body) {
		return
	}
	ctx, cancel := grpcCtx(r, 5*time.Second)
	defer cancel()
	user, err := h.auth.UpdateProfile(ctx, token, body.Name, body.AvatarKey)
	if err != nil {
		writeAuthError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"user": user})
}

func (h *Handler) AuthChangePassword(w http.ResponseWriter, r *http.Request) {
	token := middleware.ExtractSessionToken(r)
	if token == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	user, _ := middleware.UserFromContext(r.Context())
	if !h.checkAuthLimits(w, r, "change_password", user.Email) {
		return
	}
	var body struct {
		CurrentPassword      string `json:"current_password"`
		NewPassword          string `json:"new_password"`
		PasswordConfirmation string `json:"password_confirmation"`
	}
	if !decodeJSON(w, r, &body) {
		return
	}
	ctx, cancel := grpcCtx(r, 10*time.Second)
	defer cancel()
	if err := h.auth.ChangePassword(ctx, token, body.CurrentPassword, body.NewPassword, body.PasswordConfirmation); err != nil {
		writeAuthError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (h *Handler) AuthRequestSetPasswordOTP(w http.ResponseWriter, r *http.Request) {
	token := middleware.ExtractSessionToken(r)
	if token == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	user, _ := middleware.UserFromContext(r.Context())
	if !h.checkAuthLimits(w, r, "set_password_otp", user.Email) {
		return
	}
	ctx, cancel := grpcCtx(r, 10*time.Second)
	defer cancel()
	res, err := h.auth.RequestSetPasswordOTP(ctx, token)
	if err != nil {
		writeAuthError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, res)
}

func (h *Handler) AuthSetPassword(w http.ResponseWriter, r *http.Request) {
	token := middleware.ExtractSessionToken(r)
	if token == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	user, _ := middleware.UserFromContext(r.Context())
	if !h.checkAuthLimits(w, r, "set_password", user.Email) {
		return
	}
	var body struct {
		Code                 string `json:"code"`
		NewPassword          string `json:"new_password"`
		PasswordConfirmation string `json:"password_confirmation"`
	}
	if !decodeJSON(w, r, &body) {
		return
	}
	ctx, cancel := grpcCtx(r, 10*time.Second)
	defer cancel()
	user, err := h.auth.SetPassword(ctx, token, body.Code, body.NewPassword, body.PasswordConfirmation)
	if err != nil {
		writeAuthError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"user": user})
}

func (h *Handler) AuthLogout(w http.ResponseWriter, r *http.Request) {
	if token := middleware.ExtractSessionToken(r); token != "" {
		ctx, cancel := grpcCtx(r, 3*time.Second)
		defer cancel()
		if err := h.auth.SignOut(ctx, token); err != nil {
			http.Error(w, err.Error(), http.StatusBadGateway)
			return
		}
	}
	h.setSessionCookie(w, r, "", -1)
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

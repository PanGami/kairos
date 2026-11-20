package routes

import (
	"bytes"
	"context"
	"encoding/json"
	"net"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	authv1 "github.com/kairos/gateway/gen/kairos/auth/v1"
	forecastv1 "github.com/kairos/gateway/gen/kairos/forecast/v1"
	"github.com/kairos/gateway/internal/cache"
	"github.com/kairos/gateway/internal/handler"
	"github.com/kairos/gateway/internal/services"
)

type mockForecastClient struct{}

func (m *mockForecastClient) ListInstruments(_ context.Context, _ *forecastv1.ListInstrumentsRequest, _ ...grpc.CallOption) (*forecastv1.ListInstrumentsResponse, error) {
	return &forecastv1.ListInstrumentsResponse{
		Instruments: []*forecastv1.Instrument{
			{
				InstrumentId:    "IDX:TLKM",
				Symbol:          "TLKM",
				Mic:             "XIDX",
				Currency:        "IDR",
				Timezone:        "Asia/Jakarta",
				Status:          "active",
				ReliabilityTier: forecastv1.ReliabilityTier_RELIABILITY_TIER_FULL,
			},
		},
	}, nil
}

func (m *mockForecastClient) GetForecast(_ context.Context, req *forecastv1.GetForecastRequest, _ ...grpc.CallOption) (*forecastv1.GetForecastResponse, error) {
	if req.GetInstrumentId() != "IDX:TLKM" {
		return nil, status.Error(codes.NotFound, "not found")
	}
	return &forecastv1.GetForecastResponse{
		InstrumentId:    "IDX:TLKM",
		HorizonDays:     req.GetHorizonDays(),
		AsOfDate:        "2026-11-10",
		Status:          forecastv1.RunStatus_RUN_STATUS_OK,
		ReliabilityTier: forecastv1.ReliabilityTier_RELIABILITY_TIER_FULL,
		LastPrice:       2040,
		Median:          2040,
		Lower80:         1900,
		Upper80:         2172,
		Lower95:         1817,
		Upper95:         2243,
		Volatility:      &forecastv1.Volatility{Daily: 0.03, Annualized: 0.48, Lower: 0.15, Upper: 0.52},
		Correction:      &forecastv1.CorrectionProbability{Theta: 0.05, Probability: 0.42, RollingBaseRate: 0.18},
		Path:            []*forecastv1.PathPoint{{Step: 1, Median: 2040, Lower80: 1991, Upper80: 2094, Lower95: 1951, Upper95: 2133}},
	}, nil
}

func (m *mockForecastClient) GetHistory(_ context.Context, req *forecastv1.GetHistoryRequest, _ ...grpc.CallOption) (*forecastv1.GetHistoryResponse, error) {
	if req.GetInstrumentId() != "IDX:TLKM" {
		return nil, status.Error(codes.NotFound, "not found")
	}
	return &forecastv1.GetHistoryResponse{
		InstrumentId: "IDX:TLKM",
		Actual: []*forecastv1.ActualPoint{
			{Date: "2026-11-10", Close: 2040, Open: 2020, High: 2060, Low: 2010, Volume: 1500000},
		},
		Backtest: []*forecastv1.BacktestPoint{{AsOfDate: "2026-10-01", HorizonDays: 7, Median: 2100, Lower80: 1950, Upper80: 2250}},
	}, nil
}

func (m *mockForecastClient) ComputeForecast(_ context.Context, req *forecastv1.ComputeForecastRequest, _ ...grpc.CallOption) (*forecastv1.ComputeForecastResponse, error) {
	return &forecastv1.ComputeForecastResponse{
		InstrumentId:    req.GetInstrumentId(),
		Status:          forecastv1.RunStatus_RUN_STATUS_OK,
		HorizonsWritten: 2,
		Message:         "ok",
	}, nil
}

type mockAuthClient struct {
	revoked bool
}

func sampleUser() *authv1.User {
	return &authv1.User{
		UserId:        "google:dev",
		Email:         "analyst@kairos",
		Name:          "KAIROS Analyst",
		PictureUrl:    "/avatars/avatar-1.png",
		AvatarKey:     "avatar-1",
		Role:          "user",
		EmailVerified: true,
		GoogleLinked:  true,
		HasPassword:   false,
	}
}

func (m *mockAuthClient) SignInWithGoogle(_ context.Context, req *authv1.SignInWithGoogleRequest, _ ...grpc.CallOption) (*authv1.SignInWithGoogleResponse, error) {
	if req.GetIdToken() == "bad" {
		return nil, status.Error(codes.Unauthenticated, "invalid google token")
	}
	return &authv1.SignInWithGoogleResponse{
		User:         sampleUser(),
		SessionToken: "test-session-token",
		ExpiresAt:    "2026-11-22T00:00:00Z",
	}, nil
}

func (m *mockAuthClient) LinkGoogle(_ context.Context, _ *authv1.LinkGoogleRequest, _ ...grpc.CallOption) (*authv1.LinkGoogleResponse, error) {
	u := sampleUser()
	u.GoogleLinked = true
	return &authv1.LinkGoogleResponse{User: u}, nil
}

func sampleAdmin() *authv1.User {
	return &authv1.User{
		UserId:        "user:admin",
		Email:         "admin@kairos.local",
		Name:          "KAIROS Admin",
		PictureUrl:    "/avatars/avatar-1.png",
		AvatarKey:     "avatar-1",
		Role:          "admin",
		EmailVerified: true,
		GoogleLinked:  false,
		HasPassword:   true,
	}
}

func (m *mockAuthClient) ValidateSession(_ context.Context, req *authv1.ValidateSessionRequest, _ ...grpc.CallOption) (*authv1.ValidateSessionResponse, error) {
	if m.revoked {
		return &authv1.ValidateSessionResponse{Valid: false}, nil
	}
	switch req.GetSessionToken() {
	case "test-session-token":
		return &authv1.ValidateSessionResponse{
			Valid: true,
			User:  sampleUser(),
		}, nil
	case "admin-session-token":
		return &authv1.ValidateSessionResponse{
			Valid: true,
			User:  sampleAdmin(),
		}, nil
	default:
		return &authv1.ValidateSessionResponse{Valid: false}, nil
	}
}

func (m *mockAuthClient) SignOut(_ context.Context, _ *authv1.SignOutRequest, _ ...grpc.CallOption) (*authv1.SignOutResponse, error) {
	m.revoked = true
	return &authv1.SignOutResponse{Ok: true}, nil
}

func (m *mockAuthClient) Register(_ context.Context, req *authv1.RegisterRequest, _ ...grpc.CallOption) (*authv1.RegisterResponse, error) {
	if req.GetEmail() == "dup@example.com" {
		return nil, status.Error(codes.AlreadyExists, "EMAIL_EXISTS|0|dup@example.com|Email ini sudah terdaftar")
	}
	return &authv1.RegisterResponse{Email: req.GetEmail(), ResendAfterSeconds: 60, ExpiresInSeconds: 600}, nil
}

func (m *mockAuthClient) VerifyOTP(_ context.Context, req *authv1.VerifyOTPRequest, _ ...grpc.CallOption) (*authv1.VerifyOTPResponse, error) {
	if req.GetCode() != "123456" {
		return nil, status.Error(codes.InvalidArgument, "INVALID_OTP|0||Kode salah atau sudah kedaluwarsa")
	}
	return &authv1.VerifyOTPResponse{User: sampleUser(), SessionToken: "test-session-token", ExpiresAt: "2026-11-22T00:00:00Z"}, nil
}

func (m *mockAuthClient) ResendOTP(_ context.Context, _ *authv1.ResendOTPRequest, _ ...grpc.CallOption) (*authv1.ResendOTPResponse, error) {
	return &authv1.ResendOTPResponse{ResendAfterSeconds: 60, ExpiresInSeconds: 600}, nil
}

func (m *mockAuthClient) LoginWithPassword(_ context.Context, req *authv1.LoginWithPasswordRequest, _ ...grpc.CallOption) (*authv1.LoginWithPasswordResponse, error) {
	if req.GetPassword() != "ValidPass1!" {
		return nil, status.Error(codes.Unauthenticated, "INVALID_CREDENTIALS|0||Email atau password salah")
	}
	return &authv1.LoginWithPasswordResponse{User: sampleUser(), SessionToken: "test-session-token", ExpiresAt: "2026-11-22T00:00:00Z"}, nil
}

func (m *mockAuthClient) ForgotPassword(_ context.Context, _ *authv1.ForgotPasswordRequest, _ ...grpc.CallOption) (*authv1.ForgotPasswordResponse, error) {
	return &authv1.ForgotPasswordResponse{Accepted: true, ResendAfterSeconds: 60}, nil
}

func (m *mockAuthClient) ResetPassword(_ context.Context, _ *authv1.ResetPasswordRequest, _ ...grpc.CallOption) (*authv1.ResetPasswordResponse, error) {
	return &authv1.ResetPasswordResponse{Ok: true}, nil
}

func (m *mockAuthClient) UpdateProfile(_ context.Context, req *authv1.UpdateProfileRequest, _ ...grpc.CallOption) (*authv1.UpdateProfileResponse, error) {
	u := sampleUser()
	u.Name = req.GetName()
	u.AvatarKey = req.GetAvatarKey()
	u.PictureUrl = "/avatars/" + req.GetAvatarKey() + ".png"
	return &authv1.UpdateProfileResponse{User: u}, nil
}

func (m *mockAuthClient) ChangePassword(_ context.Context, _ *authv1.ChangePasswordRequest, _ ...grpc.CallOption) (*authv1.ChangePasswordResponse, error) {
	return &authv1.ChangePasswordResponse{Ok: true}, nil
}

func (m *mockAuthClient) RequestSetPasswordOTP(_ context.Context, _ *authv1.RequestSetPasswordOTPRequest, _ ...grpc.CallOption) (*authv1.RequestSetPasswordOTPResponse, error) {
	return &authv1.RequestSetPasswordOTPResponse{Email: "analyst@kairos", ResendAfterSeconds: 60, ExpiresInSeconds: 600}, nil
}

func (m *mockAuthClient) SetPassword(_ context.Context, _ *authv1.SetPasswordRequest, _ ...grpc.CallOption) (*authv1.SetPasswordResponse, error) {
	u := sampleUser()
	u.HasPassword = true
	return &authv1.SetPasswordResponse{User: u}, nil
}

func (m *mockAuthClient) ListUsers(_ context.Context, req *authv1.ListUsersRequest, _ ...grpc.CallOption) (*authv1.ListUsersResponse, error) {
	if req.GetSessionToken() != "admin-session-token" {
		return nil, status.Error(codes.PermissionDenied, "FORBIDDEN|0||Akses ditolak. Diperlukan hak akses admin.")
	}
	return &authv1.ListUsersResponse{Users: []*authv1.User{sampleAdmin(), sampleUser()}}, nil
}

func (m *mockAuthClient) SetUserSuspended(_ context.Context, req *authv1.SetUserSuspendedRequest, _ ...grpc.CallOption) (*authv1.SetUserSuspendedResponse, error) {
	if req.GetSessionToken() != "admin-session-token" {
		return nil, status.Error(codes.PermissionDenied, "FORBIDDEN|0||Akses ditolak. Diperlukan hak akses admin.")
	}
	u := sampleUser()
	u.UserId = req.GetUserId()
	u.Suspended = req.GetSuspended()
	return &authv1.SetUserSuspendedResponse{User: u}, nil
}

func (m *mockAuthClient) RevokeUserSessions(_ context.Context, req *authv1.RevokeUserSessionsRequest, _ ...grpc.CallOption) (*authv1.RevokeUserSessionsResponse, error) {
	if req.GetSessionToken() != "admin-session-token" {
		return nil, status.Error(codes.PermissionDenied, "FORBIDDEN|0||Akses ditolak. Diperlukan hak akses admin.")
	}
	return &authv1.RevokeUserSessionsResponse{RevokedCount: 2}, nil
}

func (m *mockAuthClient) DeleteUser(_ context.Context, req *authv1.DeleteUserRequest, _ ...grpc.CallOption) (*authv1.DeleteUserResponse, error) {
	if req.GetSessionToken() != "admin-session-token" {
		return nil, status.Error(codes.PermissionDenied, "FORBIDDEN|0||Akses ditolak. Diperlukan hak akses admin.")
	}
	return &authv1.DeleteUserResponse{Ok: true}, nil
}

func newTestRouter(t *testing.T) *http.ServeMux {
	t.Helper()
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("listen: %v", err)
	}
	unusedAddr := ln.Addr().String()
	_ = ln.Close()

	ml := &mockForecastClient{}
	authClient := &mockAuthClient{}
	c := cache.New(unusedAddr)
	authSvc := services.NewAuthService(authClient, "", true)
	h := handler.New(
		services.NewInstrumentService(ml, c),
		services.NewForecastService(ml, c),
		authSvc,
		"secret-admin-key",
	)
	return NewRouter(h, authSvc)
}

func authedReq(method, target string) *http.Request {
	req := httptest.NewRequest(method, target, nil)
	req.Header.Set("Authorization", "Bearer test-session-token")
	return req
}

func TestGatewayRoutes(t *testing.T) {
	mux := newTestRouter(t)

	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/healthz", nil))
	if rec.Code != http.StatusOK || rec.Body.String() != "ok" {
		t.Fatalf("/healthz unexpected: code=%d body=%q", rec.Code, rec.Body.String())
	}

	recCfg := httptest.NewRecorder()
	mux.ServeHTTP(recCfg, httptest.NewRequest(http.MethodGet, "/v1/auth/config", nil))
	if recCfg.Code != http.StatusOK {
		t.Fatalf("/v1/auth/config expected 200, got %d", recCfg.Code)
	}

	// GET /v1/auth/google/state issues cookie & state; mismatch rejected with 400.
	recState := httptest.NewRecorder()
	mux.ServeHTTP(recState, httptest.NewRequest(http.MethodGet, "/v1/auth/google/state", nil))
	if recState.Code != http.StatusOK || len(recState.Result().Cookies()) == 0 {
		t.Fatalf("expected state cookie on /v1/auth/google/state, got code=%d", recState.Code)
	}
	var statePayload struct {
		State string `json:"state"`
	}
	_ = json.Unmarshal(recState.Body.Bytes(), &statePayload)
	badStateReq := httptest.NewRequest(http.MethodPost, "/v1/auth/google", bytes.NewBufferString(`{"id_token":"dev:analyst@kairos","state":"wrong"}`))
	badStateReq.AddCookie(recState.Result().Cookies()[0])
	recBadState := httptest.NewRecorder()
	mux.ServeHTTP(recBadState, badStateReq)
	if recBadState.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 on mismatched OAuth state, got %d", recBadState.Code)
	}

	goodGoogleReq := httptest.NewRequest(http.MethodPost, "/v1/auth/google", bytes.NewBufferString(`{"id_token":"dev:analyst@kairos:KAIROS Analyst","state":"`+statePayload.State+`"}`))
	goodGoogleReq.AddCookie(recState.Result().Cookies()[0])
	recLogin := httptest.NewRecorder()
	mux.ServeHTTP(recLogin, goodGoogleReq)
	if recLogin.Code != http.StatusOK {
		t.Fatalf("/v1/auth/google expected 200, got %d (%s)", recLogin.Code, recLogin.Body.String())
	}

	// Register, conflict, login, forgot password, and profile update (ignores role mass assignment).
	recRegDup := httptest.NewRecorder()
	mux.ServeHTTP(recRegDup, httptest.NewRequest(http.MethodPost, "/v1/auth/register", bytes.NewBufferString(`{"name":"Dup","email":"dup@example.com","password":"ValidPass1!","password_confirmation":"ValidPass1!"}`)))
	if recRegDup.Code != http.StatusConflict {
		t.Fatalf("expected 409 on duplicate email register, got %d", recRegDup.Code)
	}

	recRegOK := httptest.NewRecorder()
	mux.ServeHTTP(recRegOK, httptest.NewRequest(http.MethodPost, "/v1/auth/register", bytes.NewBufferString(`{"name":"New User","email":"new@example.com","password":"ValidPass1!","password_confirmation":"ValidPass1!"}`)))
	if recRegOK.Code != http.StatusCreated {
		t.Fatalf("expected 201 on register, got %d", recRegOK.Code)
	}

	recProfile := httptest.NewRecorder()
	reqProfile := httptest.NewRequest(http.MethodPatch, "/v1/auth/profile", bytes.NewBufferString(`{"name":"Edited Name","avatar_key":"avatar-3","role":"admin"}`))
	reqProfile.Header.Set("Authorization", "Bearer test-session-token")
	mux.ServeHTTP(recProfile, reqProfile)
	if recProfile.Code != http.StatusOK {
		t.Fatalf("expected 200 on profile update, got %d", recProfile.Code)
	}
	var profResp struct {
		User struct {
			Name      string `json:"name"`
			AvatarKey string `json:"avatar_key"`
			Role      string `json:"role"`
		} `json:"user"`
	}
	_ = json.Unmarshal(recProfile.Body.Bytes(), &profResp)
	if profResp.User.Name != "Edited Name" || profResp.User.AvatarKey != "avatar-3" || profResp.User.Role != "user" {
		t.Fatalf("profile response unexpected (mass assignment guard failed): %+v", profResp.User)
	}

	recLink := httptest.NewRecorder()
	reqLink := httptest.NewRequest(http.MethodPost, "/v1/auth/google/link", bytes.NewBufferString(`{"id_token":"dev:analyst@kairos.local"}`))
	reqLink.Header.Set("Authorization", "Bearer test-session-token")
	mux.ServeHTTP(recLink, reqLink)
	if recLink.Code != http.StatusOK {
		t.Fatalf("expected 200 on /v1/auth/google/link, got %d (%s)", recLink.Code, recLink.Body.String())
	}

	// Public guest access on /v1/instruments -> 200; /v1/auth/me remains protected -> 401
	recPublicInst := httptest.NewRecorder()
	mux.ServeHTTP(recPublicInst, httptest.NewRequest(http.MethodGet, "/v1/instruments", nil))
	if recPublicInst.Code != http.StatusOK {
		t.Fatalf("public /v1/instruments expected 200, got %d", recPublicInst.Code)
	}

	recUnauthMe := httptest.NewRecorder()
	mux.ServeHTTP(recUnauthMe, httptest.NewRequest(http.MethodGet, "/v1/auth/me", nil))
	if recUnauthMe.Code != http.StatusUnauthorized {
		t.Fatalf("unauthenticated /v1/auth/me expected 401, got %d", recUnauthMe.Code)
	}

	// GET /v1/auth/me with Bearer token -> 200
	recMe := httptest.NewRecorder()
	mux.ServeHTTP(recMe, authedReq(http.MethodGet, "/v1/auth/me"))
	if recMe.Code != http.StatusOK {
		t.Fatalf("authenticated /v1/auth/me expected 200, got %d", recMe.Code)
	}

	// GET /v1/instruments with token -> 200 with ETag, then 304 Not Modified on If-None-Match
	recInst := httptest.NewRecorder()
	mux.ServeHTTP(recInst, authedReq(http.MethodGet, "/v1/instruments"))
	if recInst.Code != http.StatusOK {
		t.Fatalf("/v1/instruments expected 200, got %d", recInst.Code)
	}
	etag := recInst.Header().Get("ETag")
	if etag == "" {
		t.Fatalf("expected non-empty ETag header")
	}
	req304 := authedReq(http.MethodGet, "/v1/instruments")
	req304.Header.Set("If-None-Match", etag)
	rec304 := httptest.NewRecorder()
	mux.ServeHTTP(rec304, req304)
	if rec304.Code != http.StatusNotModified {
		t.Fatalf("expected 304 Not Modified for matching ETag, got %d", rec304.Code)
	}

	// GET /v1/instruments/IDX:TLKM/forecast?h=7 -> 200
	recFc := httptest.NewRecorder()
	mux.ServeHTTP(recFc, authedReq(http.MethodGet, "/v1/instruments/IDX:TLKM/forecast?h=7"))
	if recFc.Code != http.StatusOK {
		t.Fatalf("forecast h=7 expected 200, got %d", recFc.Code)
	}

	// GET /v1/instruments/IDX:TLKM/forecast?h=5 -> 400
	recBadH := httptest.NewRecorder()
	mux.ServeHTTP(recBadH, authedReq(http.MethodGet, "/v1/instruments/IDX:TLKM/forecast?h=5"))
	if recBadH.Code != http.StatusBadRequest {
		t.Fatalf("forecast h=5 expected 400, got %d", recBadH.Code)
	}

	// GET /v1/instruments/IDX:UNKNOWN/forecast?h=7 -> 404
	recNotFound := httptest.NewRecorder()
	mux.ServeHTTP(recNotFound, authedReq(http.MethodGet, "/v1/instruments/IDX:UNKNOWN/forecast?h=7"))
	if recNotFound.Code != http.StatusNotFound {
		t.Fatalf("unknown instrument expected 404, got %d", recNotFound.Code)
	}

	// GET /v1/instruments/IDX:TLKM/history -> 200
	recHist := httptest.NewRecorder()
	mux.ServeHTTP(recHist, authedReq(http.MethodGet, "/v1/instruments/IDX:TLKM/history"))
	if recHist.Code != http.StatusOK {
		t.Fatalf("history expected 200, got %d", recHist.Code)
	}
	var histBody struct {
		Actual []map[string]any `json:"actual"`
	}
	if err := json.Unmarshal(recHist.Body.Bytes(), &histBody); err != nil || len(histBody.Actual) != 1 {
		t.Fatalf("history body invalid: %v %s", err, recHist.Body.String())
	}
	for _, key := range []string{"date", "close", "open", "high", "low", "volume"} {
		if _, ok := histBody.Actual[0][key]; !ok {
			t.Fatalf("history actual point missing %q: %v", key, histBody.Actual[0])
		}
	}

	// POST /v1/admin/refresh: 401 with wrong key, 202 with valid key
	recUnauth := httptest.NewRecorder()
	reqUnauth := httptest.NewRequest(http.MethodPost, "/v1/admin/refresh", nil)
	reqUnauth.Header.Set("X-Admin-Api-Key", "wrong")
	mux.ServeHTTP(recUnauth, reqUnauth)
	if recUnauth.Code != http.StatusUnauthorized {
		t.Fatalf("admin refresh wrong key expected 401, got %d", recUnauth.Code)
	}

	recAuth := httptest.NewRecorder()
	reqAuth := httptest.NewRequest(http.MethodPost, "/v1/admin/refresh", nil)
	reqAuth.Header.Set("X-Admin-Api-Key", "secret-admin-key")
	mux.ServeHTTP(recAuth, reqAuth)
	if recAuth.Code != http.StatusAccepted {
		t.Fatalf("admin refresh valid key expected 202, got %d", recAuth.Code)
	}
	var payload map[string]any
	if err := json.Unmarshal(recAuth.Body.Bytes(), &payload); err != nil {
		t.Fatalf("invalid admin refresh JSON: %v", err)
	}
	if _, ok := payload["refreshed"]; !ok {
		t.Fatalf("expected 'refreshed' field in response")
	}

	// Admin RBAC routes: standard user gets 403, admin session gets 200/202.
	recUserAdminRefresh := httptest.NewRecorder()
	mux.ServeHTTP(recUserAdminRefresh, authedReq(http.MethodPost, "/v1/admin/refresh"))
	if recUserAdminRefresh.Code != http.StatusForbidden {
		t.Fatalf("non-admin session on /v1/admin/refresh expected 403, got %d", recUserAdminRefresh.Code)
	}

	adminReq := func(method, target string, body string) *http.Request {
		var buf *bytes.Buffer
		if body != "" {
			buf = bytes.NewBufferString(body)
		} else {
			buf = &bytes.Buffer{}
		}
		req := httptest.NewRequest(method, target, buf)
		req.Header.Set("Authorization", "Bearer admin-session-token")
		if body != "" {
			req.Header.Set("Content-Type", "application/json")
		}
		return req
	}

	recAdminSessionRefresh := httptest.NewRecorder()
	mux.ServeHTTP(recAdminSessionRefresh, adminReq(http.MethodPost, "/v1/admin/refresh", ""))
	if recAdminSessionRefresh.Code != http.StatusAccepted {
		t.Fatalf("admin session on /v1/admin/refresh expected 202, got %d", recAdminSessionRefresh.Code)
	}

	recUserListForbidden := httptest.NewRecorder()
	mux.ServeHTTP(recUserListForbidden, authedReq(http.MethodGet, "/v1/admin/users"))
	if recUserListForbidden.Code != http.StatusForbidden {
		t.Fatalf("non-admin session on /v1/admin/users expected 403, got %d", recUserListForbidden.Code)
	}

	recAdminList := httptest.NewRecorder()
	mux.ServeHTTP(recAdminList, adminReq(http.MethodGet, "/v1/admin/users", ""))
	if recAdminList.Code != http.StatusOK {
		t.Fatalf("admin session on /v1/admin/users expected 200, got %d", recAdminList.Code)
	}

	recSuspend := httptest.NewRecorder()
	mux.ServeHTTP(recSuspend, adminReq(http.MethodPost, "/v1/admin/users/google:dev/suspend", `{"suspended":true}`))
	if recSuspend.Code != http.StatusOK {
		t.Fatalf("admin suspend expected 200, got %d: %s", recSuspend.Code, recSuspend.Body.String())
	}

	recRevoke := httptest.NewRecorder()
	mux.ServeHTTP(recRevoke, adminReq(http.MethodPost, "/v1/admin/users/google:dev/revoke-sessions", ""))
	if recRevoke.Code != http.StatusOK {
		t.Fatalf("admin revoke sessions expected 200, got %d", recRevoke.Code)
	}

	recDelete := httptest.NewRecorder()
	mux.ServeHTTP(recDelete, adminReq(http.MethodDelete, "/v1/admin/users/google:dev", ""))
	if recDelete.Code != http.StatusOK {
		t.Fatalf("admin delete user expected 200, got %d", recDelete.Code)
	}
}

func TestGatewayCaptchaEnforcement(t *testing.T) {
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("listen: %v", err)
	}
	unusedAddr := ln.Addr().String()
	_ = ln.Close()

	turnstileSrv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_ = r.ParseForm()
		ok := r.FormValue("response") == "ok-token" && r.FormValue("secret") == "turnstile-secret"
		w.Header().Set("Content-Type", "application/json")
		if ok {
			_, _ = w.Write([]byte(`{"success":true}`))
			return
		}
		_, _ = w.Write([]byte(`{"success":false}`))
	}))
	defer turnstileSrv.Close()

	ml := &mockForecastClient{}
	authClient := &mockAuthClient{}
	c := cache.New(unusedAddr)
	authSvc := services.NewAuthService(authClient, "", true)
	authSvc.SetTurnstileSiteKey("1x00000000000000000000AA")

	verifier := services.NewCaptchaVerifier("turnstile-secret")
	verifier.Endpoint = turnstileSrv.URL

	h := handler.New(
		services.NewInstrumentService(ml, c),
		services.NewForecastService(ml, c),
		authSvc,
		"secret-admin-key",
	)
	h.SetCaptchaVerifier(verifier)
	mux := NewRouter(h, authSvc)

	recCfg := httptest.NewRecorder()
	mux.ServeHTTP(recCfg, httptest.NewRequest(http.MethodGet, "/v1/auth/config", nil))
	if recCfg.Code != http.StatusOK || !strings.Contains(recCfg.Body.String(), "1x00000000000000000000AA") {
		t.Fatalf("expected turnstile_site_key in /v1/auth/config, got code=%d body=%s", recCfg.Code, recCfg.Body.String())
	}

	// Missing token rejected with 400 CAPTCHA_FAILED
	recMissing := httptest.NewRecorder()
	mux.ServeHTTP(recMissing, httptest.NewRequest(http.MethodPost, "/v1/auth/register", bytes.NewBufferString(`{"name":"Tester","email":"t@example.com","password":"Cedar#Harbor94!","password_confirmation":"Cedar#Harbor94!"}`)))
	if recMissing.Code != http.StatusBadRequest || !strings.Contains(recMissing.Body.String(), "CAPTCHA_FAILED") {
		t.Fatalf("expected 400 CAPTCHA_FAILED, got code=%d body=%s", recMissing.Code, recMissing.Body.String())
	}

	// Valid token passes CAPTCHA and reaches auth-service Register (201)
	recValid := httptest.NewRecorder()
	mux.ServeHTTP(recValid, httptest.NewRequest(http.MethodPost, "/v1/auth/register", bytes.NewBufferString(`{"name":"Tester","email":"t@example.com","password":"Cedar#Harbor94!","password_confirmation":"Cedar#Harbor94!","captcha_token":"ok-token"}`)))
	if recValid.Code != http.StatusCreated {
		t.Fatalf("expected 201 on valid captcha_token, got code=%d body=%s", recValid.Code, recValid.Body.String())
	}
}

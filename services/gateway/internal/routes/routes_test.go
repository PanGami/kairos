package routes

import (
	"bytes"
	"context"
	"encoding/json"
	"net"
	"net/http"
	"net/http/httptest"
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
		Backtest:     []*forecastv1.BacktestPoint{{AsOfDate: "2026-10-01", HorizonDays: 7, Median: 2100, Lower80: 1950, Upper80: 2250}},
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

func (m *mockAuthClient) SignInWithGoogle(_ context.Context, req *authv1.SignInWithGoogleRequest, _ ...grpc.CallOption) (*authv1.SignInWithGoogleResponse, error) {
	if req.GetIdToken() == "bad" {
		return nil, status.Error(codes.Unauthenticated, "invalid google token")
	}
	return &authv1.SignInWithGoogleResponse{
		User: &authv1.User{
			UserId: "google:dev",
			Email:  "analyst@kairos.local",
			Name:   "KAIROS Analyst",
		},
		SessionToken: "test-session-token",
		ExpiresAt:    "2026-11-22T00:00:00Z",
	}, nil
}

func (m *mockAuthClient) ValidateSession(_ context.Context, req *authv1.ValidateSessionRequest, _ ...grpc.CallOption) (*authv1.ValidateSessionResponse, error) {
	if m.revoked || req.GetSessionToken() != "test-session-token" {
		return &authv1.ValidateSessionResponse{Valid: false}, nil
	}
	return &authv1.ValidateSessionResponse{
		Valid: true,
		User: &authv1.User{
			UserId: "google:dev",
			Email:  "analyst@kairos.local",
			Name:   "KAIROS Analyst",
		},
	}, nil
}

func (m *mockAuthClient) SignOut(_ context.Context, _ *authv1.SignOutRequest, _ ...grpc.CallOption) (*authv1.SignOutResponse, error) {
	m.revoked = true
	return &authv1.SignOutResponse{Ok: true}, nil
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

	// GET /healthz -> 200
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/healthz", nil))
	if rec.Code != http.StatusOK || rec.Body.String() != "ok" {
		t.Fatalf("/healthz unexpected: code=%d body=%q", rec.Code, rec.Body.String())
	}

	// GET /v1/auth/config -> 200
	recCfg := httptest.NewRecorder()
	mux.ServeHTTP(recCfg, httptest.NewRequest(http.MethodGet, "/v1/auth/config", nil))
	if recCfg.Code != http.StatusOK {
		t.Fatalf("/v1/auth/config expected 200, got %d", recCfg.Code)
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

	// POST /v1/auth/google -> 200 with session token
	recLogin := httptest.NewRecorder()
	mux.ServeHTTP(recLogin, httptest.NewRequest(http.MethodPost, "/v1/auth/google", bytes.NewBufferString(`{"id_token":"dev:analyst@kairos.local:KAIROS Analyst"}`)))
	if recLogin.Code != http.StatusOK {
		t.Fatalf("/v1/auth/google expected 200, got %d", recLogin.Code)
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
}

package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestWrapRequestIDAndCORS(t *testing.T) {
	var seenHeader string
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		seenHeader = r.Header.Get("X-Request-Id")
		w.WriteHeader(http.StatusOK)
	})

	h := Wrap(next, NewRateLimiter(60))

	// Generates X-Request-Id when omitted.
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/v1/instruments", nil)
	req.RemoteAddr = "10.0.0.1:1234"
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	genID := rec.Header().Get("X-Request-Id")
	if genID == "" || genID != seenHeader {
		t.Fatalf("expected generated X-Request-Id propagated, got resp=%q req=%q", genID, seenHeader)
	}
	if rec.Header().Get("Access-Control-Allow-Origin") != "*" {
		t.Fatalf("missing CORS Allow-Origin header")
	}

	// Preserves caller X-Request-Id when provided.
	rec2 := httptest.NewRecorder()
	req2 := httptest.NewRequest(http.MethodGet, "/v1/instruments", nil)
	req2.Header.Set("X-Request-Id", "req-abc-123")
	req2.RemoteAddr = "10.0.0.1:1234"
	h.ServeHTTP(rec2, req2)
	if got := rec2.Header().Get("X-Request-Id"); got != "req-abc-123" || seenHeader != "req-abc-123" {
		t.Fatalf("expected X-Request-Id preserved, got resp=%q req=%q", got, seenHeader)
	}

	// OPTIONS preflight returns 204 without reaching next handler.
	called := false
	preflightHandler := Wrap(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
	}), NewRateLimiter(60))
	recOpt := httptest.NewRecorder()
	reqOpt := httptest.NewRequest(http.MethodOptions, "/v1/instruments", nil)
	preflightHandler.ServeHTTP(recOpt, reqOpt)
	if recOpt.Code != http.StatusNoContent || called {
		t.Fatalf("expected 204 preflight short-circuit, got %d (called=%v)", recOpt.Code, called)
	}
}

func TestWrapRateLimiterReturns429(t *testing.T) {
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	h := Wrap(next, NewRateLimiter(2))

	for i := 0; i < 2; i++ {
		rec := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodGet, "/v1/instruments", nil)
		req.RemoteAddr = "192.0.2.10:5555"
		h.ServeHTTP(rec, req)
		if rec.Code != http.StatusOK {
			t.Fatalf("request %d expected 200, got %d", i+1, rec.Code)
		}
	}

	recBlocked := httptest.NewRecorder()
	reqBlocked := httptest.NewRequest(http.MethodGet, "/v1/instruments", nil)
	reqBlocked.RemoteAddr = "192.0.2.10:5555"
	h.ServeHTTP(recBlocked, reqBlocked)
	if recBlocked.Code != http.StatusTooManyRequests {
		t.Fatalf("expected 429 after burst exhausted, got %d", recBlocked.Code)
	}

	// Health probes bypass rate limit.
	recHealth := httptest.NewRecorder()
	reqHealth := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	reqHealth.RemoteAddr = "192.0.2.10:5555"
	h.ServeHTTP(recHealth, reqHealth)
	if recHealth.Code != http.StatusOK {
		t.Fatalf("expected /healthz to bypass rate limit, got %d", recHealth.Code)
	}
}

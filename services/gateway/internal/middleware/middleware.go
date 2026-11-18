// Package middleware provides per-IP token-bucket rate limiting, request-id propagation, and JSON access logging.
package middleware

import (
	"crypto/rand"
	"encoding/hex"
	"log/slog"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"
)

type bucket struct {
	tokens float64
	last   time.Time
}

type RateLimiter struct {
	mu      sync.Mutex
	rate    float64
	buckets map[string]*bucket
}

func NewRateLimiter(perMin int) *RateLimiter {
	if perMin <= 0 {
		perMin = 120
	}
	return &RateLimiter{rate: float64(perMin), buckets: make(map[string]*bucket)}
}

func (rl *RateLimiter) Allow(ip string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()
	now := time.Now()
	b, ok := rl.buckets[ip]
	if !ok {
		rl.buckets[ip] = &bucket{tokens: rl.rate - 1, last: now}
		return true
	}
	b.tokens += now.Sub(b.last).Minutes() * rl.rate
	if b.tokens > rl.rate {
		b.tokens = rl.rate
	}
	b.last = now
	if b.tokens < 1 {
		return false
	}
	b.tokens--
	return true
}

func newReqID() string {
	var b [8]byte
	_, _ = rand.Read(b[:])
	return hex.EncodeToString(b[:])
}

// ClientIP extracts the caller IP address from X-Forwarded-For or RemoteAddr.
func ClientIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		return strings.TrimSpace(strings.Split(xff, ",")[0])
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

func Wrap(next http.Handler, limiter *RateLimiter) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		rid := r.Header.Get("X-Request-Id")
		if rid == "" {
			rid = newReqID()
			r.Header.Set("X-Request-Id", rid)
		}
		w.Header().Set("X-Request-Id", rid)
		if origin := r.Header.Get("Origin"); origin != "" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Vary", "Origin")
		} else {
			w.Header().Set("Access-Control-Allow-Origin", "*")
		}
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Request-Id, X-Admin-Api-Key")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		ip := ClientIP(r)
		if r.URL.Path != "/healthz" && r.URL.Path != "/readyz" && !limiter.Allow(ip) {
			http.Error(w, "rate limit exceeded", http.StatusTooManyRequests)
			return
		}

		t0 := time.Now()
		next.ServeHTTP(w, r)
		slog.Info("http_request",
			"method", r.Method,
			"path", r.URL.Path,
			"ip", ip,
			"request_id", rid,
			"duration_ms", time.Since(t0).Milliseconds(),
		)
	})
}

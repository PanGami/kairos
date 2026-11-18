package middleware

import (
	"sync"
	"time"
)

type windowEntry struct {
	count   int
	resetAt time.Time
}

// AuthRateLimiter enforces fixed-window limits keyed by IP or normalized email for sensitive auth endpoints.
type AuthRateLimiter struct {
	mu      sync.Mutex
	limit   int
	window  time.Duration
	entries map[string]windowEntry
	now     func() time.Time
}

func NewAuthRateLimiter(limit int, window time.Duration) *AuthRateLimiter {
	if limit <= 0 {
		limit = 20
	}
	if window <= 0 {
		window = 10 * time.Minute
	}
	return &AuthRateLimiter{
		limit:   limit,
		window:  window,
		entries: make(map[string]windowEntry),
		now:     time.Now,
	}
}

func (l *AuthRateLimiter) Allow(key string) bool {
	if key == "" {
		return true
	}
	l.mu.Lock()
	defer l.mu.Unlock()

	now := l.now()
	if len(l.entries) > 4096 {
		for k, v := range l.entries {
			if !now.Before(v.resetAt) {
				delete(l.entries, k)
			}
		}
	}

	e, ok := l.entries[key]
	if !ok || !now.Before(e.resetAt) {
		l.entries[key] = windowEntry{count: 1, resetAt: now.Add(l.window)}
		return true
	}
	if e.count >= l.limit {
		return false
	}
	e.count++
	l.entries[key] = e
	return true
}

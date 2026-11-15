package services

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/kairos/auth-service/internal/repository"
)

type memSessionEntry struct {
	userID    string
	expiresAt time.Time
}

type memUserStore struct {
	users    map[string]repository.UserRecord
	sessions map[string]memSessionEntry
}

func newMemUserStore() *memUserStore {
	return &memUserStore{
		users:    make(map[string]repository.UserRecord),
		sessions: make(map[string]memSessionEntry),
	}
}

func (m *memUserStore) UpsertUser(_ context.Context, sub, email, name, picture string) (repository.UserRecord, error) {
	u := repository.UserRecord{
		UserID:     "google:" + sub,
		Email:      email,
		Name:       name,
		PictureURL: picture,
	}
	m.users[u.UserID] = u
	return u, nil
}

func (m *memUserStore) CreateSession(_ context.Context, tokenHash, userID string, expiresAt time.Time) error {
	m.sessions[tokenHash] = memSessionEntry{userID: userID, expiresAt: expiresAt}
	return nil
}

func (m *memUserStore) GetUserBySession(_ context.Context, tokenHash string) (repository.UserRecord, bool, error) {
	entry, ok := m.sessions[tokenHash]
	if !ok || !entry.expiresAt.After(time.Now().UTC()) {
		return repository.UserRecord{}, false, nil
	}
	u, exists := m.users[entry.userID]
	return u, exists, nil
}

func (m *memUserStore) DeleteSession(_ context.Context, tokenHash string) error {
	delete(m.sessions, tokenHash)
	return nil
}

func TestSessionLifecycleWithDevBypass(t *testing.T) {
	ctx := context.Background()
	store := newMemUserStore()
	verifier := NewGoogleTokenVerifier("", true)
	svc := NewSessionService(verifier, store)

	// Invalid token rejected.
	if _, err := svc.SignInWithGoogle(ctx, "dev:"); !errors.Is(err, ErrInvalidGoogleToken) {
		t.Fatalf("expected ErrInvalidGoogleToken for empty email, got %v", err)
	}

	// Valid dev sign-in creates session.
	res, err := svc.SignInWithGoogle(ctx, "dev:analyst@kairos.local:KAIROS Analyst")
	if err != nil {
		t.Fatalf("SignInWithGoogle failed: %v", err)
	}
	if res.SessionToken == "" || res.User.Email != "analyst@kairos.local" || res.User.Name != "KAIROS Analyst" {
		t.Fatalf("unexpected SignInWithGoogle result: %+v", res)
	}

	// ValidateSession succeeds with raw session token.
	user, valid, err := svc.ValidateSession(ctx, res.SessionToken)
	if err != nil || !valid || user.Email != "analyst@kairos.local" {
		t.Fatalf("ValidateSession unexpected: valid=%v user=%+v err=%v", valid, user, err)
	}

	// Unknown session returns valid=false.
	if _, ok, err := svc.ValidateSession(ctx, "nonexistent"); err != nil || ok {
		t.Fatalf("expected invalid session, got ok=%v err=%v", ok, err)
	}

	// SignOut revokes session.
	if err := svc.SignOut(ctx, res.SessionToken); err != nil {
		t.Fatalf("SignOut failed: %v", err)
	}
	if _, ok, err := svc.ValidateSession(ctx, res.SessionToken); err != nil || ok {
		t.Fatalf("expected session invalid after SignOut, got ok=%v err=%v", ok, err)
	}
}

func TestGoogleTokenInfoVerification(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Query().Get("id_token") {
		case "valid-tok":
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`{"sub":"12345","email":"user@example.com","email_verified":"true","name":"Jane Doe","aud":"my-client-id"}`))
		case "wrong-aud":
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`{"sub":"12345","email":"user@example.com","email_verified":"true","aud":"other-client"}`))
		case "unverified":
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`{"sub":"12345","email":"user@example.com","email_verified":"false","aud":"my-client-id"}`))
		default:
			w.WriteHeader(http.StatusBadRequest)
		}
	}))
	defer ts.Close()

	verifier := NewGoogleTokenVerifier("my-client-id", false)
	verifier.TokenInfoURL = ts.URL

	ident, err := verifier.VerifyIDToken(context.Background(), "valid-tok")
	if err != nil || ident.Sub != "12345" || ident.Email != "user@example.com" {
		t.Fatalf("expected verified identity, got %+v err=%v", ident, err)
	}
	if _, err := verifier.VerifyIDToken(context.Background(), "wrong-aud"); !errors.Is(err, ErrInvalidGoogleToken) {
		t.Fatalf("expected aud mismatch rejection, got %v", err)
	}
	if _, err := verifier.VerifyIDToken(context.Background(), "unverified"); !errors.Is(err, ErrInvalidGoogleToken) {
		t.Fatalf("expected unverified rejection, got %v", err)
	}
}

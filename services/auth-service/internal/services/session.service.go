package services

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"strings"
	"time"

	"github.com/kairos/auth-service/internal/repository"
)

const sessionTTL = 7 * 24 * time.Hour

type UserStore interface {
	UpsertUser(ctx context.Context, sub, email, name, picture string) (repository.UserRecord, error)
	CreateSession(ctx context.Context, tokenHash, userID string, expiresAt time.Time) error
	GetUserBySession(ctx context.Context, tokenHash string) (repository.UserRecord, bool, error)
	DeleteSession(ctx context.Context, tokenHash string) error
}

type SessionResult struct {
	User         repository.UserRecord
	SessionToken string
	ExpiresAt    time.Time
}

type SessionService struct {
	verifier GoogleVerifier
	store    UserStore
	now      func() time.Time
}

func NewSessionService(verifier GoogleVerifier, store UserStore) *SessionService {
	return &SessionService{
		verifier: verifier,
		store:    store,
		now:      time.Now,
	}
}

func hashToken(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}

func generateToken() (string, error) {
	var b [32]byte
	if _, err := rand.Read(b[:]); err != nil {
		return "", err
	}
	return hex.EncodeToString(b[:]), nil
}

func (s *SessionService) SignInWithGoogle(ctx context.Context, idToken string) (SessionResult, error) {
	ident, err := s.verifier.VerifyIDToken(ctx, idToken)
	if err != nil {
		return SessionResult{}, err
	}

	user, err := s.store.UpsertUser(ctx, ident.Sub, ident.Email, ident.Name, ident.Picture)
	if err != nil {
		return SessionResult{}, err
	}

	rawToken, err := generateToken()
	if err != nil {
		return SessionResult{}, err
	}
	expiresAt := s.now().UTC().Add(sessionTTL)
	if err := s.store.CreateSession(ctx, hashToken(rawToken), user.UserID, expiresAt); err != nil {
		return SessionResult{}, err
	}

	return SessionResult{
		User:         user,
		SessionToken: rawToken,
		ExpiresAt:    expiresAt,
	}, nil
}

func (s *SessionService) ValidateSession(ctx context.Context, sessionToken string) (repository.UserRecord, bool, error) {
	trimmed := strings.TrimSpace(sessionToken)
	if trimmed == "" {
		return repository.UserRecord{}, false, nil
	}
	return s.store.GetUserBySession(ctx, hashToken(trimmed))
}

func (s *SessionService) SignOut(ctx context.Context, sessionToken string) error {
	trimmed := strings.TrimSpace(sessionToken)
	if trimmed == "" {
		return nil
	}
	return s.store.DeleteSession(ctx, hashToken(trimmed))
}

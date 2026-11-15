// Package services implements Google ID token verification and user session management.
package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"
)

var ErrInvalidGoogleToken = errors.New("invalid google id token")

type GoogleIdentity struct {
	Sub     string
	Email   string
	Name    string
	Picture string
}

type GoogleVerifier interface {
	VerifyIDToken(ctx context.Context, idToken string) (GoogleIdentity, error)
}

type GoogleTokenVerifier struct {
	ClientID     string
	DevBypass    bool
	HTTPClient   *http.Client
	TokenInfoURL string
}

func NewGoogleTokenVerifier(clientID string, devBypass bool) *GoogleTokenVerifier {
	return &GoogleTokenVerifier{
		ClientID:     strings.TrimSpace(clientID),
		DevBypass:    devBypass,
		HTTPClient:   &http.Client{Timeout: 5 * time.Second},
		TokenInfoURL: "https://oauth2.googleapis.com/tokeninfo",
	}
}

type tokenInfoPayload struct {
	Sub           string `json:"sub"`
	Email         string `json:"email"`
	EmailVerified any    `json:"email_verified"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
	Aud           string `json:"aud"`
}

func isEmailVerified(v any) bool {
	switch val := v.(type) {
	case bool:
		return val
	case string:
		return strings.EqualFold(val, "true")
	default:
		return false
	}
}

// VerifyIDToken validates a Google OAuth2 ID token (or a local dev bypass token when enabled).
func (g *GoogleTokenVerifier) VerifyIDToken(ctx context.Context, idToken string) (GoogleIdentity, error) {
	token := strings.TrimSpace(idToken)
	if token == "" {
		return GoogleIdentity{}, ErrInvalidGoogleToken
	}

	if g.DevBypass && strings.HasPrefix(token, "dev:") {
		parts := strings.SplitN(strings.TrimPrefix(token, "dev:"), ":", 2)
		email := strings.TrimSpace(parts[0])
		if email == "" || !strings.Contains(email, "@") {
			return GoogleIdentity{}, ErrInvalidGoogleToken
		}
		name := "KAIROS Dev User"
		if len(parts) == 2 && strings.TrimSpace(parts[1]) != "" {
			name = strings.TrimSpace(parts[1])
		}
		return GoogleIdentity{
			Sub:   "dev:" + email,
			Email: email,
			Name:  name,
		}, nil
	}

	endpoint := fmt.Sprintf("%s?id_token=%s", strings.TrimRight(g.TokenInfoURL, "/"), url.QueryEscape(token))
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return GoogleIdentity{}, err
	}
	client := g.HTTPClient
	if client == nil {
		client = &http.Client{Timeout: 5 * time.Second}
	}
	resp, err := client.Do(req)
	if err != nil {
		return GoogleIdentity{}, fmt.Errorf("verify google token: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return GoogleIdentity{}, ErrInvalidGoogleToken
	}

	var payload tokenInfoPayload
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return GoogleIdentity{}, ErrInvalidGoogleToken
	}
	if payload.Sub == "" || payload.Email == "" || !isEmailVerified(payload.EmailVerified) {
		return GoogleIdentity{}, ErrInvalidGoogleToken
	}
	if g.ClientID != "" && payload.Aud != g.ClientID {
		return GoogleIdentity{}, ErrInvalidGoogleToken
	}

	name := payload.Name
	if name == "" {
		name = payload.Email
	}
	return GoogleIdentity{
		Sub:     payload.Sub,
		Email:   payload.Email,
		Name:    name,
		Picture: payload.Picture,
	}, nil
}

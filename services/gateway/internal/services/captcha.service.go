package services

import (
	"context"
	"encoding/json"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const defaultTurnstileVerifyURL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

type CaptchaVerifier struct {
	secretKey string
	Endpoint  string
	client    *http.Client
}

func NewCaptchaVerifier(secretKey string) *CaptchaVerifier {
	return &CaptchaVerifier{
		secretKey: strings.TrimSpace(secretKey),
		Endpoint:  defaultTurnstileVerifyURL,
		client:    &http.Client{Timeout: 5 * time.Second},
	}
}

func (v *CaptchaVerifier) Enabled() bool {
	return v != nil && v.secretKey != ""
}

func (v *CaptchaVerifier) Verify(ctx context.Context, token, remoteIP string) (bool, error) {
	if !v.Enabled() {
		return true, nil
	}
	trimmed := strings.TrimSpace(token)
	if trimmed == "" {
		return false, nil
	}

	form := url.Values{}
	form.Set("secret", v.secretKey)
	form.Set("response", trimmed)
	if strings.TrimSpace(remoteIP) != "" {
		form.Set("remoteip", strings.TrimSpace(remoteIP))
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, v.Endpoint, strings.NewReader(form.Encode()))
	if err != nil {
		return false, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := v.client.Do(req)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return false, nil
	}

	var parsed struct {
		Success bool `json:"success"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		return false, err
	}
	return parsed.Success, nil
}

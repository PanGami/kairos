package services

import (
	"context"
	"database/sql"
	"errors"
	"net/http"
	"net/http/httptest"
	"net/smtp"
	"sort"
	"strings"
	"testing"
	"time"

	"github.com/kairos/auth-service/internal/domain"
	"github.com/kairos/auth-service/internal/repository"
)

type memSessionEntry struct {
	userID    string
	expiresAt time.Time
}

type sentMail struct {
	kind  string
	to    string
	code  string
	notes string
}

type mockEmailSender struct {
	sent []sentMail
}

func (m *mockEmailSender) SendVerificationOTP(_ context.Context, toEmail, code string) error {
	m.sent = append(m.sent, sentMail{kind: "register_verify", to: toEmail, code: code})
	return nil
}

func (m *mockEmailSender) SendResetPasswordOTP(_ context.Context, toEmail, code string) error {
	m.sent = append(m.sent, sentMail{kind: "reset_password", to: toEmail, code: code})
	return nil
}

func (m *mockEmailSender) SendSetPasswordOTP(_ context.Context, toEmail, code string) error {
	m.sent = append(m.sent, sentMail{kind: "set_password", to: toEmail, code: code})
	return nil
}

func (m *mockEmailSender) SendPasswordChangedNotice(_ context.Context, toEmail string, changedAt time.Time) error {
	m.sent = append(m.sent, sentMail{kind: "password_changed", to: toEmail, notes: changedAt.Format(time.RFC3339)})
	return nil
}

func (m *mockEmailSender) lastCode() string {
	for i := len(m.sent) - 1; i >= 0; i-- {
		if m.sent[i].code != "" {
			return m.sent[i].code
		}
	}
	return ""
}

type memUserStore struct {
	users    map[string]repository.UserRecord
	sessions map[string]memSessionEntry
	otps     []repository.OTPRecord
	audits   []string
	nextID   int64
}

func newMemUserStore() *memUserStore {
	return &memUserStore{
		users:    make(map[string]repository.UserRecord),
		sessions: make(map[string]memSessionEntry),
	}
}

func (m *memUserStore) GetUserByEmail(_ context.Context, email string) (repository.UserRecord, bool, error) {
	for _, u := range m.users {
		if strings.EqualFold(u.Email, email) {
			return u, true, nil
		}
	}
	return repository.UserRecord{}, false, nil
}

func (m *memUserStore) GetUserByID(_ context.Context, userID string) (repository.UserRecord, bool, error) {
	u, ok := m.users[userID]
	return u, ok, nil
}

func (m *memUserStore) CreateEmailUser(_ context.Context, userID, email, name, avatarKey, pictureURL, passwordHash, role string) (repository.UserRecord, error) {
	u := repository.UserRecord{
		UserID:        userID,
		Email:         email,
		Name:          name,
		AvatarKey:     avatarKey,
		PictureURL:    pictureURL,
		PasswordHash:  passwordHash,
		EmailVerified: false,
		GoogleLinked:  false,
		Role:          role,
		HasPassword:   passwordHash != "",
	}
	m.users[u.UserID] = u
	return u, nil
}

func (m *memUserStore) SignInOrLinkGoogleUser(_ context.Context, sub, email, defaultName, defaultAvatarKey, defaultPictureURL string) (repository.UserRecord, error) {
	for id, u := range m.users {
		if u.GoogleSub == sub {
			u.GoogleLinked = true
			u.EmailVerified = true
			m.users[id] = u
			return u, nil
		}
	}
	for id, u := range m.users {
		if strings.EqualFold(u.Email, email) {
			u.GoogleSub = sub
			u.GoogleLinked = true
			u.EmailVerified = true
			m.users[id] = u
			return u, nil
		}
	}
	u := repository.UserRecord{
		UserID:        "google:" + sub,
		GoogleSub:     sub,
		Email:         email,
		Name:          defaultName,
		AvatarKey:     defaultAvatarKey,
		PictureURL:    defaultPictureURL,
		EmailVerified: true,
		GoogleLinked:  true,
		Role:          "user",
		HasPassword:   false,
	}
	m.users[u.UserID] = u
	return u, nil
}

func (m *memUserStore) MarkEmailVerified(_ context.Context, email string) (repository.UserRecord, error) {
	for id, u := range m.users {
		if strings.EqualFold(u.Email, email) {
			u.EmailVerified = true
			m.users[id] = u
			return u, nil
		}
	}
	return repository.UserRecord{}, errors.New("not found")
}

func (m *memUserStore) UpdateLastLogin(_ context.Context, _ string) error {
	return nil
}

func (m *memUserStore) UpdateUserProfile(_ context.Context, userID, name, avatarKey, pictureURL string) (repository.UserRecord, error) {
	u := m.users[userID]
	u.Name = name
	u.AvatarKey = avatarKey
	u.PictureURL = pictureURL
	m.users[userID] = u
	return u, nil
}

func (m *memUserStore) UpdateUserPassword(_ context.Context, userID, passwordHash string, markVerified bool) (repository.UserRecord, error) {
	u := m.users[userID]
	u.PasswordHash = passwordHash
	u.HasPassword = passwordHash != ""
	if markVerified {
		u.EmailVerified = true
	}
	m.users[userID] = u
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

func (m *memUserStore) DeleteAllUserSessions(_ context.Context, userID string) error {
	for k, v := range m.sessions {
		if v.userID == userID {
			delete(m.sessions, k)
		}
	}
	return nil
}

func (m *memUserStore) DeleteOtherUserSessions(_ context.Context, userID, keepTokenHash string) error {
	for k, v := range m.sessions {
		if v.userID == userID && k != keepTokenHash {
			delete(m.sessions, k)
		}
	}
	return nil
}

func (m *memUserStore) CountRecentOTPs(_ context.Context, email string, since time.Time) (int, error) {
	cnt := 0
	for _, r := range m.otps {
		if strings.EqualFold(r.Email, email) && !r.CreatedAt.Before(since) {
			cnt++
		}
	}
	return cnt, nil
}

func (m *memUserStore) GetLatestOTP(_ context.Context, email, purpose string) (repository.OTPRecord, bool, error) {
	var matched []repository.OTPRecord
	for _, r := range m.otps {
		if strings.EqualFold(r.Email, email) && r.Purpose == purpose {
			matched = append(matched, r)
		}
	}
	if len(matched) == 0 {
		return repository.OTPRecord{}, false, nil
	}
	sort.Slice(matched, func(i, j int) bool {
		if matched[i].CreatedAt.Equal(matched[j].CreatedAt) {
			return matched[i].ID > matched[j].ID
		}
		return matched[i].CreatedAt.After(matched[j].CreatedAt)
	})
	return matched[0], true, nil
}

func (m *memUserStore) InvalidateActiveOTPs(_ context.Context, email, purpose string) error {
	now := time.Now().UTC()
	for i := range m.otps {
		if strings.EqualFold(m.otps[i].Email, email) && m.otps[i].Purpose == purpose && !m.otps[i].ConsumedAt.Valid {
			m.otps[i].ConsumedAt = sql.NullTime{Time: now, Valid: true}
		}
	}
	return nil
}

func (m *memUserStore) CreateOTP(_ context.Context, email, purpose, codeHash string, maxAttempts int, expiresAt, createdAt time.Time) error {
	m.nextID++
	m.otps = append(m.otps, repository.OTPRecord{
		ID:          m.nextID,
		Email:       email,
		Purpose:     purpose,
		CodeHash:    codeHash,
		Attempts:    0,
		MaxAttempts: maxAttempts,
		ExpiresAt:   expiresAt,
		CreatedAt:   createdAt,
	})
	return nil
}

func (m *memUserStore) ConsumeOTP(_ context.Context, id int64) error {
	now := time.Now().UTC()
	for i := range m.otps {
		if m.otps[i].ID == id {
			m.otps[i].ConsumedAt = sql.NullTime{Time: now, Valid: true}
		}
	}
	return nil
}

func (m *memUserStore) IncrementOTPAttemptsAndMaybeBurn(_ context.Context, id int64) error {
	now := time.Now().UTC()
	for i := range m.otps {
		if m.otps[i].ID == id {
			m.otps[i].Attempts++
			if m.otps[i].Attempts >= m.otps[i].MaxAttempts {
				m.otps[i].ConsumedAt = sql.NullTime{Time: now, Valid: true}
			}
		}
	}
	return nil
}

func (m *memUserStore) InsertAuditLog(_ context.Context, _, _, eventType, _ string) error {
	m.audits = append(m.audits, eventType)
	return nil
}

func (m *memUserStore) CountRecentAuthEvents(_ context.Context, _ string, eventType string, _ time.Time) (int, error) {
	cnt := 0
	for _, a := range m.audits {
		if a == eventType {
			cnt++
		}
	}
	return cnt, nil
}

func TestSessionLifecycleWithDevBypass(t *testing.T) {
	ctx := context.Background()
	store := newMemUserStore()
	mailer := &mockEmailSender{}
	verifier := NewGoogleTokenVerifier("", true)
	svc := NewSessionService(verifier, store, mailer)

	if _, err := svc.SignInWithGoogle(ctx, "dev:"); !errors.Is(err, ErrInvalidGoogleToken) {
		t.Fatalf("expected ErrInvalidGoogleToken for empty email, got %v", err)
	}

	res, err := svc.SignInWithGoogle(ctx, "dev:analyst@kairos.local:KAIROS Analyst")
	if err != nil {
		t.Fatalf("SignInWithGoogle failed: %v", err)
	}
	if res.SessionToken == "" || res.User.Email != "analyst@kairos.local" || res.User.Name != "KAIROS Analyst" || res.User.Role != "user" {
		t.Fatalf("unexpected SignInWithGoogle result: %+v", res)
	}
	if !res.User.EmailVerified || !res.User.GoogleLinked || res.User.HasPassword {
		t.Fatalf("unexpected Google flags: %+v", res.User)
	}

	// Update name and ensure subsequent Google sign-in does NOT overwrite profile name or avatar.
	updated, err := svc.UpdateProfile(ctx, res.SessionToken, "Custom   Analyst", "avatar-4")
	if err != nil || updated.Name != "Custom Analyst" || updated.AvatarKey != "avatar-4" {
		t.Fatalf("UpdateProfile failed: %+v err=%v", updated, err)
	}
	res2, err := svc.SignInWithGoogle(ctx, "dev:analyst@kairos.local:Other Name")
	if err != nil || res2.User.Name != "Custom Analyst" || res2.User.AvatarKey != "avatar-4" {
		t.Fatalf("expected Google re-login to preserve edited profile, got %+v err=%v", res2.User, err)
	}

	user, valid, err := svc.ValidateSession(ctx, res.SessionToken)
	if err != nil || !valid || user.Email != "analyst@kairos.local" {
		t.Fatalf("ValidateSession unexpected: valid=%v user=%+v err=%v", valid, user, err)
	}

	if _, ok, err := svc.ValidateSession(ctx, "nonexistent"); err != nil || ok {
		t.Fatalf("expected invalid session, got ok=%v err=%v", ok, err)
	}

	if err := svc.SignOut(ctx, res.SessionToken); err != nil {
		t.Fatalf("SignOut failed: %v", err)
	}
	if _, ok, err := svc.ValidateSession(ctx, res.SessionToken); err != nil || ok {
		t.Fatalf("expected session invalid after SignOut, got ok=%v err=%v", ok, err)
	}
}

func TestRegisterOTPLoginResetAndProfilePasswordFlows(t *testing.T) {
	ctx := context.Background()
	store := newMemUserStore()
	mailer := &mockEmailSender{}
	now := time.Date(2026, 11, 18, 12, 0, 0, 0, time.UTC)
	svc := NewSessionService(NewGoogleTokenVerifier("", true), store, mailer)
	svc.now = func() time.Time { return now }
	svc.otp.now = func() time.Time { return now }

	// Register new email user.
	regRes, err := svc.Register(ctx, "  Sari   Dewi ", "SARI@example.com ", "Harbour#Pine84!", "Harbour#Pine84!")
	if err != nil {
		t.Fatalf("Register failed: %v", err)
	}
	if regRes.Email != "sari@example.com" || len(mailer.sent) != 1 {
		t.Fatalf("unexpected register result: %+v sent=%d", regRes, len(mailer.sent))
	}

	// Duplicate register rejected.
	if _, err := svc.Register(ctx, "Other", "sari@example.com", "Harbour#Pine84!", "Harbour#Pine84!"); !HasErrorCode(err, "EMAIL_EXISTS") {
		t.Fatalf("expected EMAIL_EXISTS, got %v", err)
	}

	// Login before verification returns EMAIL_NOT_VERIFIED.
	if _, err := svc.LoginWithPassword(ctx, "sari@example.com", "Harbour#Pine84!"); !HasErrorCode(err, "EMAIL_NOT_VERIFIED") {
		t.Fatalf("expected EMAIL_NOT_VERIFIED, got %v", err)
	}

	// Wrong OTP 5 times burns the code; 6th attempt with real code fails.
	otpCode := mailer.lastCode()
	for i := 0; i < 5; i++ {
		if _, err := svc.VerifyOTP(ctx, "sari@example.com", domain.OTPPurposeRegister, "000000"); !HasErrorCode(err, "INVALID_OTP") {
			t.Fatalf("attempt %d expected INVALID_OTP, got %v", i+1, err)
		}
	}
	if _, err := svc.VerifyOTP(ctx, "sari@example.com", domain.OTPPurposeRegister, otpCode); !HasErrorCode(err, "INVALID_OTP") {
		t.Fatalf("expected burned OTP to be rejected, got %v", err)
	}

	// Resend within 60s fails with OTP_COOLDOWN; after 61s succeeds and invalidates old code.
	if _, _, err := svc.ResendOTP(ctx, "sari@example.com", domain.OTPPurposeRegister); !HasErrorCode(err, "OTP_COOLDOWN") {
		t.Fatalf("expected OTP_COOLDOWN, got %v", err)
	}
	now = now.Add(61 * time.Second)
	if _, _, err := svc.ResendOTP(ctx, "sari@example.com", domain.OTPPurposeRegister); err != nil {
		t.Fatalf("ResendOTP failed after cooldown: %v", err)
	}
	freshCode := mailer.lastCode()
	verifyRes, err := svc.VerifyOTP(ctx, "sari@example.com", domain.OTPPurposeRegister, freshCode)
	if err != nil || !verifyRes.User.EmailVerified || verifyRes.SessionToken == "" {
		t.Fatalf("VerifyOTP failed: %+v err=%v", verifyRes, err)
	}

	// Create second login session, then ChangePassword revokes first session while keeping second active.
	loginRes, err := svc.LoginWithPassword(ctx, "sari@example.com", "Harbour#Pine84!")
	if err != nil {
		t.Fatalf("LoginWithPassword failed: %v", err)
	}
	if err := svc.ChangePassword(ctx, loginRes.SessionToken, "Harbour#Pine84!", "Timber#Canyon73!", "Timber#Canyon73!"); err != nil {
		t.Fatalf("ChangePassword failed: %v", err)
	}
	if _, ok, _ := svc.ValidateSession(ctx, verifyRes.SessionToken); ok {
		t.Fatalf("expected older session to be revoked on ChangePassword")
	}
	if _, ok, _ := svc.ValidateSession(ctx, loginRes.SessionToken); !ok {
		t.Fatalf("expected current session to remain valid on ChangePassword")
	}

	// ForgotPassword for unknown email succeeds uniformly.
	if _, err := svc.ForgotPassword(ctx, "nobody@example.com"); err != nil {
		t.Fatalf("expected uniform acceptance for unknown email, got %v", err)
	}

	// ForgotPassword + ResetPassword revokes ALL sessions (including current).
	now = now.Add(61 * time.Second)
	if _, err := svc.ForgotPassword(ctx, "sari@example.com"); err != nil {
		t.Fatalf("ForgotPassword failed: %v", err)
	}
	resetCode := mailer.lastCode()
	if err := svc.ResetPassword(ctx, "sari@example.com", resetCode, "Granite#Summit58!", "Granite#Summit58!"); err != nil {
		t.Fatalf("ResetPassword failed: %v", err)
	}
	if _, ok, _ := svc.ValidateSession(ctx, loginRes.SessionToken); ok {
		t.Fatalf("expected all sessions revoked after ResetPassword")
	}

	// Google login auto-links existing email+password account.
	linkedRes, err := svc.SignInWithGoogle(ctx, "dev:sari@example.com:Google Sari")
	if err != nil || !linkedRes.User.GoogleLinked || !linkedRes.User.HasPassword || linkedRes.User.Name != "Sari Dewi" {
		t.Fatalf("expected auto-link preserving existing name and password, got %+v err=%v", linkedRes.User, err)
	}
}

func TestGoogleOnlySetPasswordFlow(t *testing.T) {
	ctx := context.Background()
	store := newMemUserStore()
	mailer := &mockEmailSender{}
	svc := NewSessionService(NewGoogleTokenVerifier("", true), store, mailer)

	gRes, err := svc.SignInWithGoogle(ctx, "dev:guser@example.com:Google Only")
	if err != nil {
		t.Fatalf("SignInWithGoogle failed: %v", err)
	}
	if _, err := svc.LoginWithPassword(ctx, "guser@example.com", "Anything1!"); !HasErrorCode(err, "GOOGLE_ONLY_ACCOUNT") {
		t.Fatalf("expected GOOGLE_ONLY_ACCOUNT, got %v", err)
	}
	email, _, _, err := svc.RequestSetPasswordOTP(ctx, gRes.SessionToken)
	if err != nil || email != "guser@example.com" {
		t.Fatalf("RequestSetPasswordOTP failed: %q err=%v", email, err)
	}
	updated, err := svc.SetPassword(ctx, gRes.SessionToken, mailer.lastCode(), "Glacier#Ridge41!", "Glacier#Ridge41!")
	if err != nil || !updated.HasPassword || !updated.GoogleLinked {
		t.Fatalf("SetPassword failed: %+v err=%v", updated, err)
	}
	if _, err := svc.LoginWithPassword(ctx, "guser@example.com", "Glacier#Ridge41!"); err != nil {
		t.Fatalf("expected password login to work after SetPassword, got %v", err)
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

func TestSMTPEmailService(t *testing.T) {
	var calledAddr, calledFrom string
	var calledTo []string
	var calledMsg string

	svc := NewSMTPEmailService("smtp.gmail.com", "587", "sender@gmail.com", "app-secret", "Kairos <noreply@kairos>")
	svc.SendMail = func(addr string, _ smtp.Auth, from string, to []string, msg []byte) error {
		calledAddr = addr
		calledFrom = from
		calledTo = to
		calledMsg = string(msg)
		return nil
	}

	if err := svc.SendVerificationOTP(context.Background(), "user@example.com", "654321"); err != nil {
		t.Fatalf("SendVerificationOTP failed: %v", err)
	}
	if calledAddr != "smtp.gmail.com:587" || calledFrom != "noreply@kairos" || len(calledTo) != 1 || calledTo[0] != "user@example.com" {
		t.Fatalf("unexpected SMTP call args: addr=%q from=%q to=%v", calledAddr, calledFrom, calledTo)
	}
	if !strings.Contains(calledMsg, "654321") || !strings.Contains(calledMsg, "Never share this code with anyone.") {
		t.Fatalf("SMTP message missing OTP or warning: %s", calledMsg)
	}

	// Empty credentials fall back cleanly to dev outbox without invoking SendMail.
	devSvc := NewSMTPEmailService("smtp.gmail.com", "587", "", "", "")
	devCalled := false
	devSvc.SendMail = func(_ string, _ smtp.Auth, _ string, _ []string, _ []byte) error {
		devCalled = true
		return nil
	}
	if err := devSvc.SendResetPasswordOTP(context.Background(), "user@example.com", "112233"); err != nil || devCalled {
		t.Fatalf("expected dev outbox without SendMail, err=%v devCalled=%v", err, devCalled)
	}
}

func TestLinkGoogleFlow(t *testing.T) {
	ctx := context.Background()
	store := newMemUserStore()
	mailer := &mockEmailSender{}
	svc := NewSessionService(NewGoogleTokenVerifier("", true), store, mailer)

	if _, err := svc.Register(ctx, "Budi Rahmat", "budi@example.com", "Cedar#Harbor94!", "Cedar#Harbor94!"); err != nil {
		t.Fatalf("Register failed: %v", err)
	}
	verifyRes, err := svc.VerifyOTP(ctx, "budi@example.com", domain.OTPPurposeRegister, mailer.lastCode())
	if err != nil || verifyRes.User.GoogleLinked {
		t.Fatalf("expected unlinked email user, got %+v err=%v", verifyRes.User, err)
	}

	// Mismatched Google email must be rejected.
	if _, err := svc.LinkGoogle(ctx, verifyRes.SessionToken, "dev:other@example.com:Other User"); !HasErrorCode(err, "GOOGLE_EMAIL_MISMATCH") {
		t.Fatalf("expected GOOGLE_EMAIL_MISMATCH, got %v", err)
	}

	// Matching Google email links successfully and preserves existing display name/avatar.
	linked, err := svc.LinkGoogle(ctx, verifyRes.SessionToken, "dev:budi@example.com:Google Display Name")
	if err != nil || !linked.GoogleLinked || linked.Name != "Budi Rahmat" {
		t.Fatalf("expected Google linked preserving name, got %+v err=%v", linked, err)
	}
}

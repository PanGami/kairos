package services

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"log/slog"
	"strings"
	"time"

	"github.com/kairos/auth-service/internal/domain"
	"github.com/kairos/auth-service/internal/repository"
)

const sessionTTL = 7 * 24 * time.Hour

type UserStore interface {
	OTPStore
	GetUserByEmail(ctx context.Context, email string) (repository.UserRecord, bool, error)
	GetUserByID(ctx context.Context, userID string) (repository.UserRecord, bool, error)
	CreateEmailUser(ctx context.Context, userID, email, name, avatarKey, pictureURL, passwordHash, role string) (repository.UserRecord, error)
	SignInOrLinkGoogleUser(ctx context.Context, sub, email, defaultName, defaultAvatarKey, defaultPictureURL string) (repository.UserRecord, error)
	MarkEmailVerified(ctx context.Context, email string) (repository.UserRecord, error)
	UpdateLastLogin(ctx context.Context, userID string) error
	UpdateUserProfile(ctx context.Context, userID, name, avatarKey, pictureURL string) (repository.UserRecord, error)
	UpdateUserPassword(ctx context.Context, userID, passwordHash string, markVerified bool) (repository.UserRecord, error)
	CreateSession(ctx context.Context, tokenHash, userID string, expiresAt time.Time) error
	GetUserBySession(ctx context.Context, tokenHash string) (repository.UserRecord, bool, error)
	DeleteSession(ctx context.Context, tokenHash string) error
	DeleteAllUserSessions(ctx context.Context, userID string) error
	DeleteOtherUserSessions(ctx context.Context, userID, keepTokenHash string) error
	InsertAuditLog(ctx context.Context, userID, email, eventType, detail string) error
	CountRecentAuthEvents(ctx context.Context, email, eventType string, since time.Time) (int, error)
	PromoteUserRole(ctx context.Context, userID, role string) (repository.UserRecord, error)
	ListUsers(ctx context.Context, search string) ([]repository.UserRecord, error)
	SetUserSuspended(ctx context.Context, userID string, suspended bool) (repository.UserRecord, bool, error)
	CountAndDeleteUserSessions(ctx context.Context, userID string) (int32, error)
	DeleteUserByID(ctx context.Context, userID string) (bool, error)
}

type SessionResult struct {
	User         repository.UserRecord
	SessionToken string
	ExpiresAt    time.Time
}

type RegisterResult struct {
	Email              string
	ResendAfterSeconds int64
	ExpiresInSeconds   int64
}

type SessionService struct {
	verifier    GoogleVerifier
	store       UserStore
	otp         *OTPService
	email       EmailSender
	now         func() time.Time
	adminEmails map[string]struct{}
}

func NewSessionService(verifier GoogleVerifier, store UserStore, emailSender EmailSender) *SessionService {
	svc := &SessionService{
		verifier: verifier,
		store:    store,
		email:    emailSender,
		now:      time.Now,
	}
	svc.otp = NewOTPService(store, emailSender)
	return svc
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

func generateUserID() (string, error) {
	var b [16]byte
	if _, err := rand.Read(b[:]); err != nil {
		return "", err
	}
	return "usr:" + hex.EncodeToString(b[:]), nil
}

func (s *SessionService) issueSession(ctx context.Context, user repository.UserRecord) (SessionResult, error) {
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

func (s *SessionService) SignInWithGoogle(ctx context.Context, idToken string) (SessionResult, error) {
	ident, err := s.verifier.VerifyIDToken(ctx, idToken)
	if err != nil {
		return SessionResult{}, err
	}

	email, err := domain.NormalizeEmail(ident.Email)
	if err != nil {
		return SessionResult{}, ErrInvalidGoogleToken
	}

	defaultName := domain.DefaultGoogleName(ident.Name, email)
	avatarKey := domain.RandomAvatarKey()
	pictureURL, _ := domain.ValidateAvatarKey(avatarKey)

	user, err := s.store.SignInOrLinkGoogleUser(ctx, ident.Sub, email, defaultName, avatarKey, pictureURL)
	if err != nil {
		return SessionResult{}, err
	}
	if user.Suspended {
		return SessionResult{}, ErrAccountSuspended
	}
	user, err = s.ensureAdminRole(ctx, user)
	if err != nil {
		return SessionResult{}, err
	}
	return s.issueSession(ctx, user)
}

func (s *SessionService) LinkGoogle(ctx context.Context, sessionToken, idToken string) (repository.UserRecord, error) {
	user, valid, err := s.ValidateSession(ctx, sessionToken)
	if err != nil {
		return repository.UserRecord{}, err
	}
	if !valid {
		return repository.UserRecord{}, ErrUnauthorized
	}
	if user.GoogleLinked {
		return user, nil
	}

	ident, err := s.verifier.VerifyIDToken(ctx, idToken)
	if err != nil {
		return repository.UserRecord{}, err
	}
	email, err := domain.NormalizeEmail(ident.Email)
	if err != nil {
		return repository.UserRecord{}, ErrInvalidGoogleToken
	}
	if !strings.EqualFold(email, user.Email) {
		return repository.UserRecord{}, ErrGoogleEmailMismatch
	}

	linked, err := s.store.SignInOrLinkGoogleUser(ctx, ident.Sub, user.Email, user.Name, user.AvatarKey, user.PictureURL)
	if err != nil {
		return repository.UserRecord{}, err
	}
	if linked.UserID != user.UserID {
		return repository.UserRecord{}, ErrGoogleEmailMismatch
	}
	_ = s.store.InsertAuditLog(ctx, user.UserID, user.Email, "google_linked", "login via google activated from profile")
	return linked, nil
}

func (s *SessionService) Register(ctx context.Context, rawName, rawEmail, password, confirm string) (RegisterResult, error) {
	email, err := domain.NormalizeEmail(rawEmail)
	if err != nil {
		return RegisterResult{}, ErrInvalidEmail
	}
	name, err := domain.SanitizeAndValidateName(rawName)
	if err != nil {
		return RegisterResult{}, ErrInvalidName
	}

	existing, found, err := s.store.GetUserByEmail(ctx, email)
	if err != nil {
		return RegisterResult{}, err
	}
	if found {
		if existing.GoogleLinked {
			return RegisterResult{}, &DomainError{
				Code:    ErrEmailExistsGoogle.Code,
				Message: ErrEmailExistsGoogle.Message,
				Email:   email,
			}
		}
		return RegisterResult{}, &DomainError{
			Code:    ErrEmailExists.Code,
			Message: ErrEmailExists.Message,
			Email:   email,
		}
	}

	if password != confirm {
		return RegisterResult{}, ErrPasswordMismatch
	}
	if err := domain.ValidatePasswordPolicy(password, email, name); err != nil {
		return RegisterResult{}, ErrWeakPassword
	}

	pwHash, err := domain.HashPassword(password)
	if err != nil {
		return RegisterResult{}, err
	}
	userID, err := generateUserID()
	if err != nil {
		return RegisterResult{}, err
	}
	avatarKey := domain.RandomAvatarKey()
	pictureURL, _ := domain.ValidateAvatarKey(avatarKey)

	if _, err := s.store.CreateEmailUser(ctx, userID, email, name, avatarKey, pictureURL, pwHash, s.roleForEmail(email)); err != nil {
		return RegisterResult{}, err
	}

	resendAfter, expiresIn, err := s.otp.IssueOTP(ctx, email, domain.OTPPurposeRegister)
	if err != nil {
		return RegisterResult{}, err
	}
	_ = s.store.InsertAuditLog(ctx, userID, email, "register_created", "unverified user created")

	return RegisterResult{
		Email:              email,
		ResendAfterSeconds: resendAfter,
		ExpiresInSeconds:   expiresIn,
	}, nil
}

func (s *SessionService) VerifyOTP(ctx context.Context, rawEmail, purpose, code string) (SessionResult, error) {
	email, err := domain.NormalizeEmail(rawEmail)
	if err != nil {
		return SessionResult{}, ErrInvalidOrExpiredOTP
	}
	if purpose != domain.OTPPurposeRegister {
		return SessionResult{}, ErrInvalidOrExpiredOTP
	}
	if err := s.otp.VerifyOTP(ctx, email, purpose, code); err != nil {
		return SessionResult{}, err
	}

	user, err := s.store.MarkEmailVerified(ctx, email)
	if err != nil {
		return SessionResult{}, err
	}
	if user.Suspended {
		return SessionResult{}, ErrAccountSuspended
	}
	user, err = s.ensureAdminRole(ctx, user)
	if err != nil {
		return SessionResult{}, err
	}
	_ = s.store.InsertAuditLog(ctx, user.UserID, email, "register_verified", "email verified via otp")
	return s.issueSession(ctx, user)
}

func (s *SessionService) ResendOTP(ctx context.Context, rawEmail, purpose string) (int64, int64, error) {
	email, err := domain.NormalizeEmail(rawEmail)
	if err != nil {
		return 0, 0, ErrInvalidEmail
	}
	if !domain.IsValidOTPPurpose(purpose) {
		return 0, 0, ErrInvalidOrExpiredOTP
	}

	user, found, err := s.store.GetUserByEmail(ctx, email)
	if err != nil {
		return 0, 0, err
	}
	if !found {
		if purpose == domain.OTPPurposeReset {
			// Return uniform acceptance to prevent email enumeration on reset flow.
			return int64(otpResendCooldown.Seconds()), int64(otpTTL.Seconds()), nil
		}
		return 0, 0, ErrInvalidOrExpiredOTP
	}
	if purpose == domain.OTPPurposeRegister && user.EmailVerified {
		return 0, 0, ErrInvalidOrExpiredOTP
	}

	return s.otp.IssueOTP(ctx, email, purpose)
}

func (s *SessionService) LoginWithPassword(ctx context.Context, rawEmail, password string) (SessionResult, error) {
	email, err := domain.NormalizeEmail(rawEmail)
	if err != nil || password == "" {
		return SessionResult{}, ErrInvalidCredentials
	}

	user, found, err := s.store.GetUserByEmail(ctx, email)
	if err != nil {
		return SessionResult{}, err
	}
	if !found {
		s.recordFailedLogin(ctx, "", email)
		return SessionResult{}, ErrInvalidCredentials
	}

	if !user.HasPassword {
		return SessionResult{}, &DomainError{
			Code:    ErrGoogleOnlyAccount.Code,
			Message: ErrGoogleOnlyAccount.Message,
			Email:   email,
		}
	}

	if !domain.VerifyPassword(password, user.PasswordHash) {
		s.recordFailedLogin(ctx, user.UserID, email)
		return SessionResult{}, ErrInvalidCredentials
	}
	if user.Suspended {
		return SessionResult{}, ErrAccountSuspended
	}

	if !user.EmailVerified {
		_, _, otpErr := s.otp.IssueOTP(ctx, email, domain.OTPPurposeRegister)
		var retry int64
		var de *DomainError
		if errors.As(otpErr, &de) && de.Code == ErrOTPCooldown.Code {
			retry = de.Retry
		} else if otpErr != nil && !errors.As(otpErr, &de) {
			return SessionResult{}, otpErr
		}
		return SessionResult{}, &DomainError{
			Code:    ErrEmailNotVerified.Code,
			Message: ErrEmailNotVerified.Message,
			Email:   email,
			Retry:   retry,
		}
	}

	user, err = s.ensureAdminRole(ctx, user)
	if err != nil {
		return SessionResult{}, err
	}
	_ = s.store.UpdateLastLogin(ctx, user.UserID)
	return s.issueSession(ctx, user)
}

func (s *SessionService) recordFailedLogin(ctx context.Context, userID, email string) {
	_ = s.store.InsertAuditLog(ctx, userID, email, "login_failed", "invalid password or email")
	count, err := s.store.CountRecentAuthEvents(ctx, email, "login_failed", s.now().UTC().Add(-15*time.Minute))
	if err == nil && count >= 3 {
		slog.Warn("auth.login.repeated_failures", "email", email, "user_id", userID, "count_15m", count)
		_ = s.store.InsertAuditLog(ctx, userID, email, "login_failed_repeated", "3+ failed attempts in 15m")
	}
}

func (s *SessionService) ForgotPassword(ctx context.Context, rawEmail string) (int64, error) {
	email, err := domain.NormalizeEmail(rawEmail)
	if err != nil {
		return 0, ErrInvalidEmail
	}

	user, found, err := s.store.GetUserByEmail(ctx, email)
	if err != nil {
		return 0, err
	}
	if !found {
		return int64(otpResendCooldown.Seconds()), nil
	}

	resendAfter, _, err := s.otp.IssueOTP(ctx, user.Email, domain.OTPPurposeReset)
	if err != nil {
		var de *DomainError
		if errors.As(err, &de) && (de.Code == ErrOTPCooldown.Code || de.Code == ErrOTPRateLimited.Code) {
			// Keep forgot-password response uniform so cooldown/limits never leak whether email exists.
			return int64(otpResendCooldown.Seconds()), nil
		}
		return 0, err
	}
	return resendAfter, nil
}

func (s *SessionService) ResetPassword(ctx context.Context, rawEmail, code, newPassword, confirm string) error {
	email, err := domain.NormalizeEmail(rawEmail)
	if err != nil {
		return ErrInvalidOrExpiredOTP
	}
	if newPassword != confirm {
		return ErrPasswordMismatch
	}

	user, found, err := s.store.GetUserByEmail(ctx, email)
	if err != nil {
		return err
	}
	if !found {
		return ErrInvalidOrExpiredOTP
	}

	if err := s.otp.VerifyOTP(ctx, email, domain.OTPPurposeReset, code); err != nil {
		return err
	}
	if err := domain.ValidatePasswordPolicy(newPassword, user.Email, user.Name); err != nil {
		return ErrWeakPassword
	}

	pwHash, err := domain.HashPassword(newPassword)
	if err != nil {
		return err
	}
	if _, err := s.store.UpdateUserPassword(ctx, user.UserID, pwHash, true); err != nil {
		return err
	}
	if err := s.store.DeleteAllUserSessions(ctx, user.UserID); err != nil {
		return err
	}

	now := s.now().UTC()
	_ = s.store.InsertAuditLog(ctx, user.UserID, user.Email, "password_reset", "password reset and all sessions revoked")
	if err := s.email.SendPasswordChangedNotice(ctx, user.Email, now); err != nil {
		slog.Warn("auth.email.password_changed_notice_failed", "user_id", user.UserID, "err", err)
	}
	return nil
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

func (s *SessionService) UpdateProfile(ctx context.Context, sessionToken, rawName, avatarKey string) (repository.UserRecord, error) {
	user, valid, err := s.ValidateSession(ctx, sessionToken)
	if err != nil {
		return repository.UserRecord{}, err
	}
	if !valid {
		return repository.UserRecord{}, ErrUnauthorized
	}

	cleanName, err := domain.SanitizeAndValidateName(rawName)
	if err != nil {
		return repository.UserRecord{}, ErrInvalidName
	}
	pictureURL, ok := domain.ValidateAvatarKey(avatarKey)
	if !ok {
		return repository.UserRecord{}, ErrInvalidAvatar
	}

	return s.store.UpdateUserProfile(ctx, user.UserID, cleanName, strings.TrimSpace(avatarKey), pictureURL)
}

func (s *SessionService) ChangePassword(ctx context.Context, sessionToken, currentPassword, newPassword, confirm string) error {
	user, valid, err := s.ValidateSession(ctx, sessionToken)
	if err != nil {
		return err
	}
	if !valid {
		return ErrUnauthorized
	}
	if !user.HasPassword {
		return ErrGoogleOnlyAccount
	}
	if !domain.VerifyPassword(currentPassword, user.PasswordHash) {
		return ErrInvalidCredentials
	}
	if newPassword != confirm {
		return ErrPasswordMismatch
	}
	if newPassword == currentPassword {
		return ErrPasswordSameAsOld
	}
	if err := domain.ValidatePasswordPolicy(newPassword, user.Email, user.Name); err != nil {
		return ErrWeakPassword
	}

	pwHash, err := domain.HashPassword(newPassword)
	if err != nil {
		return err
	}
	if _, err := s.store.UpdateUserPassword(ctx, user.UserID, pwHash, false); err != nil {
		return err
	}
	if err := s.store.DeleteOtherUserSessions(ctx, user.UserID, hashToken(strings.TrimSpace(sessionToken))); err != nil {
		return err
	}

	now := s.now().UTC()
	_ = s.store.InsertAuditLog(ctx, user.UserID, user.Email, "password_changed", "password updated and other sessions revoked")
	if err := s.email.SendPasswordChangedNotice(ctx, user.Email, now); err != nil {
		slog.Warn("auth.email.password_changed_notice_failed", "user_id", user.UserID, "err", err)
	}
	return nil
}

func (s *SessionService) RequestSetPasswordOTP(ctx context.Context, sessionToken string) (string, int64, int64, error) {
	user, valid, err := s.ValidateSession(ctx, sessionToken)
	if err != nil {
		return "", 0, 0, err
	}
	if !valid {
		return "", 0, 0, ErrUnauthorized
	}
	if user.HasPassword {
		return "", 0, 0, ErrPasswordAlreadySet
	}

	resendAfter, expiresIn, err := s.otp.IssueOTP(ctx, user.Email, domain.OTPPurposeSetPassword)
	if err != nil {
		return "", 0, 0, err
	}
	return user.Email, resendAfter, expiresIn, nil
}

func (s *SessionService) SetPassword(ctx context.Context, sessionToken, code, newPassword, confirm string) (repository.UserRecord, error) {
	user, valid, err := s.ValidateSession(ctx, sessionToken)
	if err != nil {
		return repository.UserRecord{}, err
	}
	if !valid {
		return repository.UserRecord{}, ErrUnauthorized
	}
	if user.HasPassword {
		return repository.UserRecord{}, ErrPasswordAlreadySet
	}
	if newPassword != confirm {
		return repository.UserRecord{}, ErrPasswordMismatch
	}
	if err := domain.ValidatePasswordPolicy(newPassword, user.Email, user.Name); err != nil {
		return repository.UserRecord{}, ErrWeakPassword
	}
	if err := s.otp.VerifyOTP(ctx, user.Email, domain.OTPPurposeSetPassword, code); err != nil {
		return repository.UserRecord{}, err
	}

	pwHash, err := domain.HashPassword(newPassword)
	if err != nil {
		return repository.UserRecord{}, err
	}
	updated, err := s.store.UpdateUserPassword(ctx, user.UserID, pwHash, true)
	if err != nil {
		return repository.UserRecord{}, err
	}
	if err := s.store.DeleteOtherUserSessions(ctx, user.UserID, hashToken(strings.TrimSpace(sessionToken))); err != nil {
		return repository.UserRecord{}, err
	}

	now := s.now().UTC()
	_ = s.store.InsertAuditLog(ctx, user.UserID, user.Email, "password_created", "initial password created for google user")
	if err := s.email.SendPasswordChangedNotice(ctx, user.Email, now); err != nil {
		slog.Warn("auth.email.password_changed_notice_failed", "user_id", user.UserID, "err", err)
	}
	return updated, nil
}

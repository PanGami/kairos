package services

import (
	"context"
	"crypto/subtle"
	"log/slog"
	"strings"
	"time"

	"github.com/kairos/auth-service/internal/domain"
	"github.com/kairos/auth-service/internal/repository"
)

const (
	otpTTL             = 10 * time.Minute
	otpResendCooldown  = 60 * time.Second
	otpMaxHourlyCount  = 5
	otpMaxWrongAttempt = 5
)

type OTPStore interface {
	CountRecentOTPs(ctx context.Context, email string, since time.Time) (int, error)
	GetLatestOTP(ctx context.Context, email, purpose string) (repository.OTPRecord, bool, error)
	InvalidateActiveOTPs(ctx context.Context, email, purpose string) error
	CreateOTP(ctx context.Context, email, purpose, codeHash string, maxAttempts int, expiresAt, createdAt time.Time) error
	ConsumeOTP(ctx context.Context, id int64) error
	IncrementOTPAttemptsAndMaybeBurn(ctx context.Context, id int64) error
}

type OTPService struct {
	store OTPStore
	email EmailSender
	now   func() time.Time
}

func NewOTPService(store OTPStore, email EmailSender) *OTPService {
	return &OTPService{
		store: store,
		email: email,
		now:   time.Now,
	}
}

// IssueOTP enforces 60s resend cooldown and 5/hour cap, invalidates previous active OTPs for the same purpose,
// stores a hashed 6-digit code valid for 10 minutes, and sends the email via EmailSender.
func (s *OTPService) IssueOTP(ctx context.Context, email, purpose string) (int64, int64, error) {
	now := s.now().UTC()

	if latest, ok, err := s.store.GetLatestOTP(ctx, email, purpose); err != nil {
		return 0, 0, err
	} else if ok {
		elapsed := now.Sub(latest.CreatedAt)
		if elapsed < otpResendCooldown {
			rem := int64((otpResendCooldown - elapsed).Seconds()) + 1
			return 0, 0, &DomainError{
				Code:    ErrOTPCooldown.Code,
				Message: ErrOTPCooldown.Message,
				Email:   email,
				Retry:   rem,
			}
		}
	}

	recentCount, err := s.store.CountRecentOTPs(ctx, email, now.Add(-1*time.Hour))
	if err != nil {
		return 0, 0, err
	}
	if recentCount >= otpMaxHourlyCount {
		slog.Warn("auth.otp.hourly_limit_reached", "email", email, "purpose", purpose)
		return 0, 0, &DomainError{
			Code:    ErrOTPRateLimited.Code,
			Message: ErrOTPRateLimited.Message,
			Email:   email,
		}
	}

	code, err := domain.GenerateOTPCode()
	if err != nil {
		return 0, 0, err
	}
	if err := s.store.InvalidateActiveOTPs(ctx, email, purpose); err != nil {
		return 0, 0, err
	}
	expiresAt := now.Add(otpTTL)
	codeHash := domain.HashOTP(email, purpose, code)
	if err := s.store.CreateOTP(ctx, email, purpose, codeHash, otpMaxWrongAttempt, expiresAt, now); err != nil {
		return 0, 0, err
	}

	switch purpose {
	case domain.OTPPurposeRegister:
		err = s.email.SendVerificationOTP(ctx, email, code)
	case domain.OTPPurposeReset:
		err = s.email.SendResetPasswordOTP(ctx, email, code)
	case domain.OTPPurposeSetPassword:
		err = s.email.SendSetPasswordOTP(ctx, email, code)
	}
	if err != nil {
		return 0, 0, err
	}

	return int64(otpResendCooldown.Seconds()), int64(otpTTL.Seconds()), nil
}

// VerifyOTP validates an OTP code once, burning it on the 5th failed attempt.
func (s *OTPService) VerifyOTP(ctx context.Context, email, purpose, code string) error {
	cleanCode := strings.TrimSpace(code)
	if len(cleanCode) != 6 {
		return ErrInvalidOrExpiredOTP
	}

	rec, ok, err := s.store.GetLatestOTP(ctx, email, purpose)
	if err != nil {
		return err
	}
	now := s.now().UTC()
	if !ok || rec.ConsumedAt.Valid || now.After(rec.ExpiresAt) || rec.Attempts >= rec.MaxAttempts {
		return ErrInvalidOrExpiredOTP
	}

	expected := domain.HashOTP(email, purpose, cleanCode)
	if subtle.ConstantTimeCompare([]byte(rec.CodeHash), []byte(expected)) != 1 {
		if err := s.store.IncrementOTPAttemptsAndMaybeBurn(ctx, rec.ID); err != nil {
			return err
		}
		return ErrInvalidOrExpiredOTP
	}

	if err := s.store.ConsumeOTP(ctx, rec.ID); err != nil {
		return err
	}
	return nil
}

package repository

import (
	"context"
	"database/sql"
	"errors"
	"time"
)

type OTPRecord struct {
	ID          int64
	Email       string
	Purpose     string
	CodeHash    string
	Attempts    int
	MaxAttempts int
	ExpiresAt   time.Time
	ConsumedAt  sql.NullTime
	CreatedAt   time.Time
}

func (s *PostgresUserStore) CountRecentOTPs(ctx context.Context, email string, since time.Time) (int, error) {
	const q = `
SELECT COUNT(*)
FROM user_otps
WHERE LOWER(email) = LOWER($1) AND created_at >= $2;`
	var count int
	err := s.db.QueryRowContext(ctx, q, email, since).Scan(&count)
	return count, err
}

func (s *PostgresUserStore) GetLatestOTP(ctx context.Context, email, purpose string) (OTPRecord, bool, error) {
	const q = `
SELECT id, email, purpose, code_hash, attempts, max_attempts, expires_at, consumed_at, created_at
FROM user_otps
WHERE LOWER(email) = LOWER($1) AND purpose = $2
ORDER BY created_at DESC, id DESC
LIMIT 1;`
	var r OTPRecord
	err := s.db.QueryRowContext(ctx, q, email, purpose).Scan(
		&r.ID,
		&r.Email,
		&r.Purpose,
		&r.CodeHash,
		&r.Attempts,
		&r.MaxAttempts,
		&r.ExpiresAt,
		&r.ConsumedAt,
		&r.CreatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return OTPRecord{}, false, nil
	}
	if err != nil {
		return OTPRecord{}, false, err
	}
	return r, true, nil
}

func (s *PostgresUserStore) InvalidateActiveOTPs(ctx context.Context, email, purpose string) error {
	const q = `
UPDATE user_otps
SET consumed_at = now()
WHERE LOWER(email) = LOWER($1) AND purpose = $2 AND consumed_at IS NULL;`
	_, err := s.db.ExecContext(ctx, q, email, purpose)
	return err
}

func (s *PostgresUserStore) CreateOTP(
	ctx context.Context,
	email, purpose, codeHash string,
	maxAttempts int,
	expiresAt, createdAt time.Time,
) error {
	const q = `
INSERT INTO user_otps (email, purpose, code_hash, attempts, max_attempts, expires_at, created_at)
VALUES ($1, $2, $3, 0, $4, $5, $6);`
	_, err := s.db.ExecContext(ctx, q, email, purpose, codeHash, maxAttempts, expiresAt, createdAt)
	return err
}

func (s *PostgresUserStore) ConsumeOTP(ctx context.Context, id int64) error {
	const q = `UPDATE user_otps SET consumed_at = now() WHERE id = $1;`
	_, err := s.db.ExecContext(ctx, q, id)
	return err
}

func (s *PostgresUserStore) IncrementOTPAttemptsAndMaybeBurn(ctx context.Context, id int64) error {
	const q = `
UPDATE user_otps
SET attempts = attempts + 1,
    consumed_at = CASE WHEN attempts + 1 >= max_attempts THEN now() ELSE consumed_at END
WHERE id = $1;`
	_, err := s.db.ExecContext(ctx, q, id)
	return err
}

func (s *PostgresUserStore) InsertAuditLog(ctx context.Context, userID, email, eventType, detail string) error {
	const q = `
INSERT INTO auth_audit_logs (user_id, email, event_type, detail)
VALUES ($1, $2, $3, $4);`
	_, err := s.db.ExecContext(ctx, q, userID, email, eventType, detail)
	return err
}

func (s *PostgresUserStore) CountRecentAuthEvents(ctx context.Context, email, eventType string, since time.Time) (int, error) {
	const q = `
SELECT COUNT(*)
FROM auth_audit_logs
WHERE LOWER(email) = LOWER($1) AND event_type = $2 AND created_at >= $3;`
	var count int
	err := s.db.QueryRowContext(ctx, q, email, eventType, since).Scan(&count)
	return count, err
}

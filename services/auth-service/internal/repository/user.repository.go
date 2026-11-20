// Package repository handles PostgreSQL persistence for auth-service owned tables.
package repository

import (
	"context"
	"database/sql"
	"errors"
	"time"
)

type UserRecord struct {
	UserID         string
	GoogleSub      string
	Email          string
	Name           string
	PictureURL     string
	AvatarKey      string
	PasswordHash   string
	EmailVerified  bool
	GoogleLinked   bool
	Role           string
	HasPassword    bool
	Suspended      bool
	CreatedAt      time.Time
	LastLoginAt    time.Time
	ActiveSessions int32
}

type PostgresUserStore struct {
	db *sql.DB
}

func NewPostgresUserStore(db *sql.DB) *PostgresUserStore {
	return &PostgresUserStore{db: db}
}

const userSelectCols = `
	user_id,
	COALESCE(google_sub, ''),
	email,
	name,
	picture_url,
	avatar_key,
	password_hash,
	email_verified,
	google_linked,
	role,
	(password_hash <> '') AS has_password,
	suspended,
	created_at,
	last_login_at
`

func scanUser(row interface{ Scan(dest ...any) error }) (UserRecord, error) {
	var u UserRecord
	err := row.Scan(
		&u.UserID,
		&u.GoogleSub,
		&u.Email,
		&u.Name,
		&u.PictureURL,
		&u.AvatarKey,
		&u.PasswordHash,
		&u.EmailVerified,
		&u.GoogleLinked,
		&u.Role,
		&u.HasPassword,
		&u.Suspended,
		&u.CreatedAt,
		&u.LastLoginAt,
	)
	return u, err
}

// EnsureSchema creates and migrates auth-service owned tables idempotently.
func (s *PostgresUserStore) EnsureSchema(ctx context.Context) error {
	const ddl = `
CREATE TABLE IF NOT EXISTS users (
  user_id        TEXT PRIMARY KEY,
  google_sub     TEXT UNIQUE,
  email          TEXT UNIQUE NOT NULL,
  name           TEXT NOT NULL,
  picture_url    TEXT NOT NULL DEFAULT '/avatars/avatar-1.png',
  avatar_key     TEXT NOT NULL DEFAULT 'avatar-1',
  password_hash  TEXT NOT NULL DEFAULT '',
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  google_linked  BOOLEAN NOT NULL DEFAULT FALSE,
  role           TEXT NOT NULL DEFAULT 'user',
  suspended      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_key TEXT NOT NULL DEFAULT 'avatar-1';
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_linked BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ALTER COLUMN google_sub DROP NOT NULL;

UPDATE users
SET google_linked = TRUE,
    email_verified = TRUE
WHERE google_sub IS NOT NULL
  AND google_sub <> ''
  AND (google_linked = FALSE OR email_verified = FALSE);

UPDATE users
SET avatar_key = 'avatar-' || ((abs(hashtext(user_id)) % 9) + 1)::text,
    picture_url = '/avatars/avatar-' || ((abs(hashtext(user_id)) % 9) + 1)::text || '.png'
WHERE avatar_key NOT IN ('avatar-1','avatar-2','avatar-3','avatar-4','avatar-5','avatar-6','avatar-7','avatar-8','avatar-9')
   OR picture_url NOT LIKE '/avatars/%';

CREATE TABLE IF NOT EXISTS user_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_otps (
  id           BIGSERIAL PRIMARY KEY,
  email        TEXT NOT NULL,
  purpose      TEXT NOT NULL CHECK (purpose IN ('register_verify', 'reset_password', 'set_password')),
  code_hash    TEXT NOT NULL,
  attempts     INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  expires_at   TIMESTAMPTZ NOT NULL,
  consumed_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_otps_email_purpose ON user_otps (email, purpose, created_at DESC);

CREATE TABLE IF NOT EXISTS auth_audit_logs (
  id         BIGSERIAL PRIMARY KEY,
  user_id    TEXT,
  email      TEXT,
  event_type TEXT NOT NULL,
  detail     TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`
	_, err := s.db.ExecContext(ctx, ddl)
	return err
}

func (s *PostgresUserStore) GetUserByEmail(ctx context.Context, email string) (UserRecord, bool, error) {
	q := `SELECT ` + userSelectCols + ` FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1;`
	u, err := scanUser(s.db.QueryRowContext(ctx, q, email))
	if errors.Is(err, sql.ErrNoRows) {
		return UserRecord{}, false, nil
	}
	if err != nil {
		return UserRecord{}, false, err
	}
	return u, true, nil
}

func (s *PostgresUserStore) GetUserByID(ctx context.Context, userID string) (UserRecord, bool, error) {
	q := `SELECT ` + userSelectCols + ` FROM users WHERE user_id = $1 LIMIT 1;`
	u, err := scanUser(s.db.QueryRowContext(ctx, q, userID))
	if errors.Is(err, sql.ErrNoRows) {
		return UserRecord{}, false, nil
	}
	if err != nil {
		return UserRecord{}, false, err
	}
	return u, true, nil
}

func (s *PostgresUserStore) CreateEmailUser(
	ctx context.Context,
	userID, email, name, avatarKey, pictureURL, passwordHash, role string,
) (UserRecord, error) {
	q := `
INSERT INTO users (
  user_id, google_sub, email, name, picture_url, avatar_key,
  password_hash, email_verified, google_linked, role, created_at, last_login_at
)
VALUES ($1, NULL, $2, $3, $4, $5, $6, FALSE, FALSE, $7, now(), now())
RETURNING ` + userSelectCols + `;`
	return scanUser(s.db.QueryRowContext(ctx, q, userID, email, name, pictureURL, avatarKey, passwordHash, role))
}

// SignInOrLinkGoogleUser logs in an existing Google user, auto-links an existing email+password account,
// or creates a new verified Google account without overwriting existing custom names or avatars.
func (s *PostgresUserStore) SignInOrLinkGoogleUser(
	ctx context.Context,
	sub, email, defaultName, defaultAvatarKey, defaultPictureURL string,
) (UserRecord, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return UserRecord{}, err
	}
	defer func() { _ = tx.Rollback() }()

	bySubQ := `
UPDATE users
SET last_login_at = now(),
    google_linked = TRUE,
    email_verified = TRUE
WHERE google_sub = $1
RETURNING ` + userSelectCols + `;`
	u, err := scanUser(tx.QueryRowContext(ctx, bySubQ, sub))
	if err == nil {
		if commitErr := tx.Commit(); commitErr != nil {
			return UserRecord{}, commitErr
		}
		return u, nil
	}
	if !errors.Is(err, sql.ErrNoRows) {
		return UserRecord{}, err
	}

	byEmailQ := `
UPDATE users
SET google_sub = $1,
    google_linked = TRUE,
    email_verified = TRUE,
    last_login_at = now()
WHERE LOWER(email) = LOWER($2)
RETURNING ` + userSelectCols + `;`
	u, err = scanUser(tx.QueryRowContext(ctx, byEmailQ, sub, email))
	if err == nil {
		if commitErr := tx.Commit(); commitErr != nil {
			return UserRecord{}, commitErr
		}
		return u, nil
	}
	if !errors.Is(err, sql.ErrNoRows) {
		return UserRecord{}, err
	}

	insertQ := `
INSERT INTO users (
  user_id, google_sub, email, name, picture_url, avatar_key,
  password_hash, email_verified, google_linked, role, created_at, last_login_at
)
VALUES ($1, $2, $3, $4, $5, $6, '', TRUE, TRUE, 'user', now(), now())
RETURNING ` + userSelectCols + `;`
	userID := "google:" + sub
	u, err = scanUser(tx.QueryRowContext(ctx, insertQ, userID, sub, email, defaultName, defaultPictureURL, defaultAvatarKey))
	if err != nil {
		return UserRecord{}, err
	}
	if commitErr := tx.Commit(); commitErr != nil {
		return UserRecord{}, commitErr
	}
	return u, nil
}

func (s *PostgresUserStore) MarkEmailVerified(ctx context.Context, email string) (UserRecord, error) {
	q := `
UPDATE users
SET email_verified = TRUE,
    last_login_at = now()
WHERE LOWER(email) = LOWER($1)
RETURNING ` + userSelectCols + `;`
	return scanUser(s.db.QueryRowContext(ctx, q, email))
}

func (s *PostgresUserStore) UpdateLastLogin(ctx context.Context, userID string) error {
	_, err := s.db.ExecContext(ctx, `UPDATE users SET last_login_at = now() WHERE user_id = $1;`, userID)
	return err
}

func (s *PostgresUserStore) UpdateUserProfile(ctx context.Context, userID, name, avatarKey, pictureURL string) (UserRecord, error) {
	q := `
UPDATE users
SET name = $2,
    avatar_key = $3,
    picture_url = $4
WHERE user_id = $1
RETURNING ` + userSelectCols + `;`
	return scanUser(s.db.QueryRowContext(ctx, q, userID, name, avatarKey, pictureURL))
}

func (s *PostgresUserStore) UpdateUserPassword(ctx context.Context, userID, passwordHash string, markVerified bool) (UserRecord, error) {
	q := `
UPDATE users
SET password_hash = $2,
    email_verified = CASE WHEN $3 THEN TRUE ELSE email_verified END
WHERE user_id = $1
RETURNING ` + userSelectCols + `;`
	return scanUser(s.db.QueryRowContext(ctx, q, userID, passwordHash, markVerified))
}

func (s *PostgresUserStore) CreateSession(ctx context.Context, tokenHash, userID string, expiresAt time.Time) error {
	const q = `
INSERT INTO user_sessions (token_hash, user_id, expires_at)
VALUES ($1, $2, $3);`
	_, err := s.db.ExecContext(ctx, q, tokenHash, userID, expiresAt)
	return err
}

func (s *PostgresUserStore) GetUserBySession(ctx context.Context, tokenHash string) (UserRecord, bool, error) {
	q := `
SELECT
	u.user_id,
	COALESCE(u.google_sub, ''),
	u.email,
	u.name,
	u.picture_url,
	u.avatar_key,
	u.password_hash,
	u.email_verified,
	u.google_linked,
	u.role,
	(u.password_hash <> '') AS has_password,
	u.suspended,
	u.created_at,
	u.last_login_at
FROM user_sessions s
JOIN users u ON u.user_id = s.user_id
WHERE s.token_hash = $1 AND s.expires_at > now() AND u.suspended = FALSE
LIMIT 1;`
	u, err := scanUser(s.db.QueryRowContext(ctx, q, tokenHash))
	if errors.Is(err, sql.ErrNoRows) {
		return UserRecord{}, false, nil
	}
	if err != nil {
		return UserRecord{}, false, err
	}
	return u, true, nil
}

func (s *PostgresUserStore) DeleteSession(ctx context.Context, tokenHash string) error {
	const q = `DELETE FROM user_sessions WHERE token_hash = $1;`
	_, err := s.db.ExecContext(ctx, q, tokenHash)
	return err
}

func (s *PostgresUserStore) DeleteAllUserSessions(ctx context.Context, userID string) error {
	const q = `DELETE FROM user_sessions WHERE user_id = $1;`
	_, err := s.db.ExecContext(ctx, q, userID)
	return err
}

func (s *PostgresUserStore) DeleteOtherUserSessions(ctx context.Context, userID, keepTokenHash string) error {
	const q = `DELETE FROM user_sessions WHERE user_id = $1 AND token_hash <> $2;`
	_, err := s.db.ExecContext(ctx, q, userID, keepTokenHash)
	return err
}

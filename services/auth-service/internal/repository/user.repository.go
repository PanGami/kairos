// Package repository handles PostgreSQL persistence for auth-service owned tables (users, user_sessions).
package repository

import (
	"context"
	"database/sql"
	"errors"
	"time"
)

type UserRecord struct {
	UserID     string
	Email      string
	Name       string
	PictureURL string
}

type PostgresUserStore struct {
	db *sql.DB
}

func NewPostgresUserStore(db *sql.DB) *PostgresUserStore {
	return &PostgresUserStore{db: db}
}

// EnsureSchema creates auth-service owned tables idempotently so existing local volumes work without reset.
func (s *PostgresUserStore) EnsureSchema(ctx context.Context) error {
	const ddl = `
CREATE TABLE IF NOT EXISTS users (
  user_id       TEXT PRIMARY KEY,
  google_sub    TEXT UNIQUE NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  picture_url   TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS user_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`
	_, err := s.db.ExecContext(ctx, ddl)
	return err
}

func (s *PostgresUserStore) UpsertUser(ctx context.Context, sub, email, name, picture string) (UserRecord, error) {
	userID := "google:" + sub
	const q = `
INSERT INTO users (user_id, google_sub, email, name, picture_url, created_at, last_login_at)
VALUES ($1, $2, $3, $4, $5, now(), now())
ON CONFLICT (google_sub) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  picture_url = EXCLUDED.picture_url,
  last_login_at = now()
RETURNING user_id, email, name, picture_url;`
	var u UserRecord
	err := s.db.QueryRowContext(ctx, q, userID, sub, email, name, picture).
		Scan(&u.UserID, &u.Email, &u.Name, &u.PictureURL)
	return u, err
}

func (s *PostgresUserStore) CreateSession(ctx context.Context, tokenHash, userID string, expiresAt time.Time) error {
	const q = `
INSERT INTO user_sessions (token_hash, user_id, expires_at)
VALUES ($1, $2, $3);`
	_, err := s.db.ExecContext(ctx, q, tokenHash, userID, expiresAt)
	return err
}

func (s *PostgresUserStore) GetUserBySession(ctx context.Context, tokenHash string) (UserRecord, bool, error) {
	const q = `
SELECT u.user_id, u.email, u.name, u.picture_url
FROM user_sessions s
JOIN users u ON u.user_id = s.user_id
WHERE s.token_hash = $1 AND s.expires_at > now()
LIMIT 1;`
	var u UserRecord
	err := s.db.QueryRowContext(ctx, q, tokenHash).
		Scan(&u.UserID, &u.Email, &u.Name, &u.PictureURL)
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

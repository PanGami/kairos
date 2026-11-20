package repository

import (
	"context"
	"database/sql"
	"errors"
	"strings"
)

// SyncAdminEmails promotes configured admin emails at service startup without modifying other users.
func (s *PostgresUserStore) SyncAdminEmails(ctx context.Context, emails []string) error {
	for _, raw := range emails {
		email := strings.ToLower(strings.TrimSpace(raw))
		if email == "" {
			continue
		}
		if _, err := s.db.ExecContext(ctx, `UPDATE users SET role = 'admin' WHERE LOWER(email) = $1 AND role <> 'admin';`, email); err != nil {
			return err
		}
	}
	return nil
}

// PromoteUserRole updates a user's RBAC role and returns the updated record.
func (s *PostgresUserStore) PromoteUserRole(ctx context.Context, userID, role string) (UserRecord, error) {
	q := `UPDATE users SET role = $2 WHERE user_id = $1 RETURNING ` + userSelectCols + `;`
	return scanUser(s.db.QueryRowContext(ctx, q, userID, role))
}

// ListUsers returns all users matching the optional search query, ordered newest first with active session counts.
func (s *PostgresUserStore) ListUsers(ctx context.Context, search string) ([]UserRecord, error) {
	term := strings.TrimSpace(search)
	var rows *sql.Rows
	var err error
	const baseSelect = `
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
	u.last_login_at,
	COUNT(s.token_hash) FILTER (WHERE s.expires_at > now())::int AS active_sessions
FROM users u
LEFT JOIN user_sessions s ON s.user_id = u.user_id`

	if term != "" {
		like := "%" + term + "%"
		rows, err = s.db.QueryContext(ctx, baseSelect+`
WHERE u.email ILIKE $1 OR u.name ILIKE $1
GROUP BY u.user_id
ORDER BY u.created_at DESC;`, like)
	} else {
		rows, err = s.db.QueryContext(ctx, baseSelect+`
GROUP BY u.user_id
ORDER BY u.created_at DESC;`)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []UserRecord
	for rows.Next() {
		var u UserRecord
		if scanErr := rows.Scan(
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
			&u.ActiveSessions,
		); scanErr != nil {
			return nil, scanErr
		}
		users = append(users, u)
	}
	return users, rows.Err()
}

// SetUserSuspended toggles a user's suspended flag and returns whether the target user existed.
func (s *PostgresUserStore) SetUserSuspended(ctx context.Context, userID string, suspended bool) (UserRecord, bool, error) {
	q := `UPDATE users SET suspended = $2 WHERE user_id = $1 RETURNING ` + userSelectCols + `;`
	u, err := scanUser(s.db.QueryRowContext(ctx, q, userID, suspended))
	if errors.Is(err, sql.ErrNoRows) {
		return UserRecord{}, false, nil
	}
	if err != nil {
		return UserRecord{}, false, err
	}
	return u, true, nil
}

// CountAndDeleteUserSessions revokes all active and expired sessions for a user and returns deleted row count.
func (s *PostgresUserStore) CountAndDeleteUserSessions(ctx context.Context, userID string) (int32, error) {
	res, err := s.db.ExecContext(ctx, `DELETE FROM user_sessions WHERE user_id = $1;`, userID)
	if err != nil {
		return 0, err
	}
	n, err := res.RowsAffected()
	if err != nil {
		return 0, err
	}
	return int32(n), nil
}

// DeleteUserByID deletes a user (cascading user_sessions) and cleans up user_otps for that email.
func (s *PostgresUserStore) DeleteUserByID(ctx context.Context, userID string) (bool, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return false, err
	}
	defer func() { _ = tx.Rollback() }()

	var email string
	if err := tx.QueryRowContext(ctx, `SELECT email FROM users WHERE user_id = $1;`, userID).Scan(&email); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return false, nil
		}
		return false, err
	}

	if _, err := tx.ExecContext(ctx, `DELETE FROM user_otps WHERE LOWER(email) = LOWER($1);`, email); err != nil {
		return false, err
	}
	if _, err := tx.ExecContext(ctx, `DELETE FROM users WHERE user_id = $1;`, userID); err != nil {
		return false, err
	}
	if err := tx.Commit(); err != nil {
		return false, err
	}
	return true, nil
}

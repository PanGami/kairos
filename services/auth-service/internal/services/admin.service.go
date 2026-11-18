package services

import (
	"context"
	"strings"

	"github.com/kairos/auth-service/internal/repository"
)

// ParseAdminEmails splits a comma-separated list of emails into normalized lowercase entries.
func ParseAdminEmails(raw string) []string {
	parts := strings.Split(raw, ",")
	seen := make(map[string]struct{}, len(parts))
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		email := strings.ToLower(strings.TrimSpace(p))
		if email == "" {
			continue
		}
		if _, ok := seen[email]; ok {
			continue
		}
		seen[email] = struct{}{}
		out = append(out, email)
	}
	return out
}

// SetAdminEmails configures normalized emails that are automatically promoted to the admin role.
func (s *SessionService) SetAdminEmails(emails []string) {
	m := make(map[string]struct{}, len(emails))
	for _, e := range emails {
		norm := strings.ToLower(strings.TrimSpace(e))
		if norm != "" {
			m[norm] = struct{}{}
		}
	}
	s.adminEmails = m
}

func (s *SessionService) isAdminEmail(email string) bool {
	if len(s.adminEmails) == 0 {
		return false
	}
	_, ok := s.adminEmails[strings.ToLower(strings.TrimSpace(email))]
	return ok
}

func (s *SessionService) roleForEmail(email string) string {
	if s.isAdminEmail(email) {
		return "admin"
	}
	return "user"
}

func (s *SessionService) ensureAdminRole(ctx context.Context, user repository.UserRecord) (repository.UserRecord, error) {
	if user.Role == "admin" || !s.isAdminEmail(user.Email) {
		return user, nil
	}
	promoted, err := s.store.PromoteUserRole(ctx, user.UserID, "admin")
	if err != nil {
		return user, err
	}
	_ = s.store.InsertAuditLog(ctx, promoted.UserID, promoted.Email, "role_promoted", "promoted via ADMIN_EMAILS")
	return promoted, nil
}

func (s *SessionService) requireAdmin(ctx context.Context, sessionToken string) (repository.UserRecord, error) {
	actor, valid, err := s.ValidateSession(ctx, sessionToken)
	if err != nil {
		return repository.UserRecord{}, err
	}
	if !valid {
		return repository.UserRecord{}, ErrUnauthorized
	}
	if actor.Role != "admin" {
		return repository.UserRecord{}, ErrForbidden
	}
	return actor, nil
}

// ListUsers returns directory entries matching search for authenticated admin callers.
func (s *SessionService) ListUsers(ctx context.Context, sessionToken, search string) ([]repository.UserRecord, error) {
	if _, err := s.requireAdmin(ctx, sessionToken); err != nil {
		return nil, err
	}
	return s.store.ListUsers(ctx, search)
}

// SetUserSuspended suspends or reactivates a target user and revokes all active sessions when suspended.
func (s *SessionService) SetUserSuspended(ctx context.Context, sessionToken, targetUserID string, suspended bool) (repository.UserRecord, error) {
	actor, err := s.requireAdmin(ctx, sessionToken)
	if err != nil {
		return repository.UserRecord{}, err
	}
	targetID := strings.TrimSpace(targetUserID)
	if targetID == "" {
		return repository.UserRecord{}, ErrUserNotFound
	}
	if actor.UserID == targetID {
		return repository.UserRecord{}, ErrCannotModifySelf
	}

	updated, found, err := s.store.SetUserSuspended(ctx, targetID, suspended)
	if err != nil {
		return repository.UserRecord{}, err
	}
	if !found {
		return repository.UserRecord{}, ErrUserNotFound
	}
	if suspended {
		if _, err := s.store.CountAndDeleteUserSessions(ctx, targetID); err != nil {
			return repository.UserRecord{}, err
		}
		_ = s.store.InsertAuditLog(ctx, targetID, updated.Email, "user_suspended", "suspended by admin "+actor.UserID)
	} else {
		_ = s.store.InsertAuditLog(ctx, targetID, updated.Email, "user_activated", "activated by admin "+actor.UserID)
	}
	return updated, nil
}

// RevokeUserSessions force-logs out all sessions belonging to the target user.
func (s *SessionService) RevokeUserSessions(ctx context.Context, sessionToken, targetUserID string) (int32, error) {
	actor, err := s.requireAdmin(ctx, sessionToken)
	if err != nil {
		return 0, err
	}
	targetID := strings.TrimSpace(targetUserID)
	if targetID == "" {
		return 0, ErrUserNotFound
	}
	target, found, err := s.store.GetUserByID(ctx, targetID)
	if err != nil {
		return 0, err
	}
	if !found {
		return 0, ErrUserNotFound
	}
	revoked, err := s.store.CountAndDeleteUserSessions(ctx, targetID)
	if err != nil {
		return 0, err
	}
	_ = s.store.InsertAuditLog(ctx, targetID, target.Email, "sessions_revoked", "revoked by admin "+actor.UserID)
	return revoked, nil
}

// DeleteUser permanently deletes a user account other than the acting admin's own account.
func (s *SessionService) DeleteUser(ctx context.Context, sessionToken, targetUserID string) error {
	actor, err := s.requireAdmin(ctx, sessionToken)
	if err != nil {
		return err
	}
	targetID := strings.TrimSpace(targetUserID)
	if targetID == "" {
		return ErrUserNotFound
	}
	if actor.UserID == targetID {
		return ErrCannotModifySelf
	}
	target, found, err := s.store.GetUserByID(ctx, targetID)
	if err != nil {
		return err
	}
	if !found {
		return ErrUserNotFound
	}
	deleted, err := s.store.DeleteUserByID(ctx, targetID)
	if err != nil {
		return err
	}
	if !deleted {
		return ErrUserNotFound
	}
	_ = s.store.InsertAuditLog(ctx, targetID, target.Email, "user_deleted", "deleted by admin "+actor.UserID)
	return nil
}

// Package handler implements the thin gRPC transport layer for AuthService.
package handler

import (
	"context"
	"errors"
	"log/slog"
	"time"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"

	authv1 "github.com/kairos/auth-service/gen/kairos/auth/v1"
	"github.com/kairos/auth-service/internal/repository"
	"github.com/kairos/auth-service/internal/services"
)

type AuthServicer struct {
	authv1.UnimplementedAuthServiceServer
	sessions *services.SessionService
}

func NewAuthServicer(sessions *services.SessionService) *AuthServicer {
	return &AuthServicer{sessions: sessions}
}

func requestID(ctx context.Context) string {
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return ""
	}
	if vals := md.Get("x-request-id"); len(vals) > 0 {
		return vals[0]
	}
	return ""
}

func toProtoUser(u repository.UserRecord) *authv1.User {
	role := u.Role
	if role == "" {
		role = "user"
	}
	var createdAt, lastLoginAt string
	if !u.CreatedAt.IsZero() {
		createdAt = u.CreatedAt.UTC().Format(time.RFC3339)
	}
	if !u.LastLoginAt.IsZero() {
		lastLoginAt = u.LastLoginAt.UTC().Format(time.RFC3339)
	}
	return &authv1.User{
		UserId:         u.UserID,
		Email:          u.Email,
		Name:           u.Name,
		PictureUrl:     u.PictureURL,
		AvatarKey:      u.AvatarKey,
		Role:           role,
		EmailVerified:  u.EmailVerified,
		GoogleLinked:   u.GoogleLinked,
		HasPassword:    u.HasPassword,
		Suspended:      u.Suspended,
		CreatedAt:      createdAt,
		LastLoginAt:    lastLoginAt,
		ActiveSessions: u.ActiveSessions,
	}
}

func mapDomainError(rid, op string, err error) error {
	if errors.Is(err, services.ErrInvalidGoogleToken) {
		slog.Warn("auth.signin.invalid", "request_id", rid)
		return status.Error(codes.Unauthenticated, "invalid google token")
	}

	var de *services.DomainError
	if !errors.As(err, &de) {
		slog.Error("auth.internal.error", "op", op, "request_id", rid, "err", err)
		return status.Error(codes.Internal, "auth operation failed")
	}

	var code codes.Code
	switch de.Code {
	case services.ErrInvalidCredentials.Code, services.ErrUnauthorized.Code:
		code = codes.Unauthenticated
	case services.ErrEmailExists.Code, services.ErrEmailExistsGoogle.Code, services.ErrPasswordAlreadySet.Code, services.ErrGoogleAlreadyLinked.Code:
		code = codes.AlreadyExists
	case services.ErrEmailNotVerified.Code, services.ErrGoogleOnlyAccount.Code, services.ErrForbidden.Code, services.ErrAccountSuspended.Code:
		code = codes.PermissionDenied
	case services.ErrUserNotFound.Code:
		code = codes.NotFound
	case services.ErrOTPCooldown.Code, services.ErrOTPRateLimited.Code:
		code = codes.ResourceExhausted
	default:
		code = codes.InvalidArgument
	}
	slog.Info("auth.domain.rejected", "op", op, "code", de.Code, "request_id", rid)
	return status.Error(code, services.EncodeGRPCMessage(de))
}

func (h *AuthServicer) SignInWithGoogle(ctx context.Context, req *authv1.SignInWithGoogleRequest) (*authv1.SignInWithGoogleResponse, error) {
	rid := requestID(ctx)
	res, err := h.sessions.SignInWithGoogle(ctx, req.GetIdToken())
	if err != nil {
		return nil, mapDomainError(rid, "google_signin", err)
	}
	slog.Info("auth.signin.ok", "user_id", res.User.UserID, "request_id", rid)
	return &authv1.SignInWithGoogleResponse{
		User:         toProtoUser(res.User),
		SessionToken: res.SessionToken,
		ExpiresAt:    res.ExpiresAt.Format(time.RFC3339),
	}, nil
}

func (h *AuthServicer) LinkGoogle(ctx context.Context, req *authv1.LinkGoogleRequest) (*authv1.LinkGoogleResponse, error) {
	rid := requestID(ctx)
	user, err := h.sessions.LinkGoogle(ctx, req.GetSessionToken(), req.GetIdToken())
	if err != nil {
		return nil, mapDomainError(rid, "link_google", err)
	}
	slog.Info("auth.google.linked", "user_id", user.UserID, "request_id", rid)
	return &authv1.LinkGoogleResponse{User: toProtoUser(user)}, nil
}

func (h *AuthServicer) ValidateSession(ctx context.Context, req *authv1.ValidateSessionRequest) (*authv1.ValidateSessionResponse, error) {
	user, valid, err := h.sessions.ValidateSession(ctx, req.GetSessionToken())
	if err != nil {
		slog.Error("auth.validate.error", "request_id", requestID(ctx), "err", err)
		return nil, status.Error(codes.Internal, "session validation failed")
	}
	if !valid {
		return &authv1.ValidateSessionResponse{Valid: false}, nil
	}
	return &authv1.ValidateSessionResponse{Valid: true, User: toProtoUser(user)}, nil
}

func (h *AuthServicer) SignOut(ctx context.Context, req *authv1.SignOutRequest) (*authv1.SignOutResponse, error) {
	rid := requestID(ctx)
	if err := h.sessions.SignOut(ctx, req.GetSessionToken()); err != nil {
		slog.Error("auth.signout.error", "request_id", rid, "err", err)
		return nil, status.Error(codes.Internal, "sign-out failed")
	}
	slog.Info("auth.signout.ok", "request_id", rid)
	return &authv1.SignOutResponse{Ok: true}, nil
}

func (h *AuthServicer) Register(ctx context.Context, req *authv1.RegisterRequest) (*authv1.RegisterResponse, error) {
	rid := requestID(ctx)
	res, err := h.sessions.Register(ctx, req.GetName(), req.GetEmail(), req.GetPassword(), req.GetPasswordConfirmation())
	if err != nil {
		return nil, mapDomainError(rid, "register", err)
	}
	slog.Info("auth.register.otp_sent", "email", res.Email, "request_id", rid)
	return &authv1.RegisterResponse{
		Email:              res.Email,
		ResendAfterSeconds: res.ResendAfterSeconds,
		ExpiresInSeconds:   res.ExpiresInSeconds,
	}, nil
}

func (h *AuthServicer) VerifyOTP(ctx context.Context, req *authv1.VerifyOTPRequest) (*authv1.VerifyOTPResponse, error) {
	rid := requestID(ctx)
	res, err := h.sessions.VerifyOTP(ctx, req.GetEmail(), req.GetPurpose(), req.GetCode())
	if err != nil {
		return nil, mapDomainError(rid, "verify_otp", err)
	}
	slog.Info("auth.otp.verified", "user_id", res.User.UserID, "request_id", rid)
	return &authv1.VerifyOTPResponse{
		User:         toProtoUser(res.User),
		SessionToken: res.SessionToken,
		ExpiresAt:    res.ExpiresAt.Format(time.RFC3339),
	}, nil
}

func (h *AuthServicer) ResendOTP(ctx context.Context, req *authv1.ResendOTPRequest) (*authv1.ResendOTPResponse, error) {
	rid := requestID(ctx)
	resendAfter, expiresIn, err := h.sessions.ResendOTP(ctx, req.GetEmail(), req.GetPurpose())
	if err != nil {
		return nil, mapDomainError(rid, "resend_otp", err)
	}
	slog.Info("auth.otp.resent", "purpose", req.GetPurpose(), "request_id", rid)
	return &authv1.ResendOTPResponse{
		ResendAfterSeconds: resendAfter,
		ExpiresInSeconds:   expiresIn,
	}, nil
}

func (h *AuthServicer) LoginWithPassword(ctx context.Context, req *authv1.LoginWithPasswordRequest) (*authv1.LoginWithPasswordResponse, error) {
	rid := requestID(ctx)
	res, err := h.sessions.LoginWithPassword(ctx, req.GetEmail(), req.GetPassword())
	if err != nil {
		return nil, mapDomainError(rid, "login_password", err)
	}
	slog.Info("auth.login.ok", "user_id", res.User.UserID, "request_id", rid)
	return &authv1.LoginWithPasswordResponse{
		User:         toProtoUser(res.User),
		SessionToken: res.SessionToken,
		ExpiresAt:    res.ExpiresAt.Format(time.RFC3339),
	}, nil
}

func (h *AuthServicer) ForgotPassword(ctx context.Context, req *authv1.ForgotPasswordRequest) (*authv1.ForgotPasswordResponse, error) {
	rid := requestID(ctx)
	resendAfter, err := h.sessions.ForgotPassword(ctx, req.GetEmail())
	if err != nil {
		return nil, mapDomainError(rid, "forgot_password", err)
	}
	slog.Info("auth.password.forgot_requested", "request_id", rid)
	return &authv1.ForgotPasswordResponse{
		Accepted:           true,
		ResendAfterSeconds: resendAfter,
	}, nil
}

func (h *AuthServicer) ResetPassword(ctx context.Context, req *authv1.ResetPasswordRequest) (*authv1.ResetPasswordResponse, error) {
	rid := requestID(ctx)
	if err := h.sessions.ResetPassword(ctx, req.GetEmail(), req.GetCode(), req.GetNewPassword(), req.GetPasswordConfirmation()); err != nil {
		return nil, mapDomainError(rid, "reset_password", err)
	}
	slog.Info("auth.password.reset_ok", "request_id", rid)
	return &authv1.ResetPasswordResponse{Ok: true}, nil
}

func (h *AuthServicer) UpdateProfile(ctx context.Context, req *authv1.UpdateProfileRequest) (*authv1.UpdateProfileResponse, error) {
	rid := requestID(ctx)
	user, err := h.sessions.UpdateProfile(ctx, req.GetSessionToken(), req.GetName(), req.GetAvatarKey())
	if err != nil {
		return nil, mapDomainError(rid, "update_profile", err)
	}
	slog.Info("auth.profile.updated", "user_id", user.UserID, "request_id", rid)
	return &authv1.UpdateProfileResponse{User: toProtoUser(user)}, nil
}

func (h *AuthServicer) ChangePassword(ctx context.Context, req *authv1.ChangePasswordRequest) (*authv1.ChangePasswordResponse, error) {
	rid := requestID(ctx)
	if err := h.sessions.ChangePassword(ctx, req.GetSessionToken(), req.GetCurrentPassword(), req.GetNewPassword(), req.GetPasswordConfirmation()); err != nil {
		return nil, mapDomainError(rid, "change_password", err)
	}
	slog.Info("auth.password.changed", "request_id", rid)
	return &authv1.ChangePasswordResponse{Ok: true}, nil
}

func (h *AuthServicer) RequestSetPasswordOTP(ctx context.Context, req *authv1.RequestSetPasswordOTPRequest) (*authv1.RequestSetPasswordOTPResponse, error) {
	rid := requestID(ctx)
	email, resendAfter, expiresIn, err := h.sessions.RequestSetPasswordOTP(ctx, req.GetSessionToken())
	if err != nil {
		return nil, mapDomainError(rid, "request_set_password_otp", err)
	}
	slog.Info("auth.password.set_otp_sent", "request_id", rid)
	return &authv1.RequestSetPasswordOTPResponse{
		Email:              email,
		ResendAfterSeconds: resendAfter,
		ExpiresInSeconds:   expiresIn,
	}, nil
}

func (h *AuthServicer) SetPassword(ctx context.Context, req *authv1.SetPasswordRequest) (*authv1.SetPasswordResponse, error) {
	rid := requestID(ctx)
	user, err := h.sessions.SetPassword(ctx, req.GetSessionToken(), req.GetCode(), req.GetNewPassword(), req.GetPasswordConfirmation())
	if err != nil {
		return nil, mapDomainError(rid, "set_password", err)
	}
	slog.Info("auth.password.set_ok", "user_id", user.UserID, "request_id", rid)
	return &authv1.SetPasswordResponse{User: toProtoUser(user)}, nil
}

func (h *AuthServicer) ListUsers(ctx context.Context, req *authv1.ListUsersRequest) (*authv1.ListUsersResponse, error) {
	rid := requestID(ctx)
	users, err := h.sessions.ListUsers(ctx, req.GetSessionToken(), req.GetSearch())
	if err != nil {
		return nil, mapDomainError(rid, "list_users", err)
	}
	out := make([]*authv1.User, 0, len(users))
	for _, u := range users {
		out = append(out, toProtoUser(u))
	}
	return &authv1.ListUsersResponse{Users: out}, nil
}

func (h *AuthServicer) SetUserSuspended(ctx context.Context, req *authv1.SetUserSuspendedRequest) (*authv1.SetUserSuspendedResponse, error) {
	rid := requestID(ctx)
	user, err := h.sessions.SetUserSuspended(ctx, req.GetSessionToken(), req.GetUserId(), req.GetSuspended())
	if err != nil {
		return nil, mapDomainError(rid, "set_user_suspended", err)
	}
	slog.Info("auth.admin.suspend_updated", "target_user_id", user.UserID, "suspended", user.Suspended, "request_id", rid)
	return &authv1.SetUserSuspendedResponse{User: toProtoUser(user)}, nil
}

func (h *AuthServicer) RevokeUserSessions(ctx context.Context, req *authv1.RevokeUserSessionsRequest) (*authv1.RevokeUserSessionsResponse, error) {
	rid := requestID(ctx)
	count, err := h.sessions.RevokeUserSessions(ctx, req.GetSessionToken(), req.GetUserId())
	if err != nil {
		return nil, mapDomainError(rid, "revoke_user_sessions", err)
	}
	slog.Info("auth.admin.sessions_revoked", "target_user_id", req.GetUserId(), "revoked_count", count, "request_id", rid)
	return &authv1.RevokeUserSessionsResponse{RevokedCount: count}, nil
}

func (h *AuthServicer) DeleteUser(ctx context.Context, req *authv1.DeleteUserRequest) (*authv1.DeleteUserResponse, error) {
	rid := requestID(ctx)
	if err := h.sessions.DeleteUser(ctx, req.GetSessionToken(), req.GetUserId()); err != nil {
		return nil, mapDomainError(rid, "delete_user", err)
	}
	slog.Info("auth.admin.user_deleted", "target_user_id", req.GetUserId(), "request_id", rid)
	return &authv1.DeleteUserResponse{Ok: true}, nil
}

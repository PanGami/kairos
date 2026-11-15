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
	return &authv1.User{
		UserId:     u.UserID,
		Email:      u.Email,
		Name:       u.Name,
		PictureUrl: u.PictureURL,
	}
}

func (h *AuthServicer) SignInWithGoogle(ctx context.Context, req *authv1.SignInWithGoogleRequest) (*authv1.SignInWithGoogleResponse, error) {
	rid := requestID(ctx)
	res, err := h.sessions.SignInWithGoogle(ctx, req.GetIdToken())
	if err != nil {
		if errors.Is(err, services.ErrInvalidGoogleToken) {
			slog.Warn("auth.signin.invalid", "request_id", rid)
			return nil, status.Error(codes.Unauthenticated, "invalid google token")
		}
		slog.Error("auth.signin.error", "request_id", rid, "err", err)
		return nil, status.Error(codes.Internal, "sign-in failed")
	}

	slog.Info("auth.signin.ok", "user_id", res.User.UserID, "request_id", rid)
	return &authv1.SignInWithGoogleResponse{
		User:         toProtoUser(res.User),
		SessionToken: res.SessionToken,
		ExpiresAt:    res.ExpiresAt.Format(time.RFC3339),
	}, nil
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

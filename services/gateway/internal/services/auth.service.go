package services

import (
	"context"

	authv1 "github.com/kairos/gateway/gen/kairos/auth/v1"
)

type AuthConfig struct {
	GoogleClientID  string `json:"google_client_id"`
	DevLoginEnabled bool   `json:"dev_login_enabled"`
}

type UserDTO struct {
	UserID     string `json:"user_id"`
	Email      string `json:"email"`
	Name       string `json:"name"`
	PictureURL string `json:"picture_url"`
}

type SignInDTO struct {
	User         UserDTO `json:"user"`
	SessionToken string  `json:"session_token"`
	ExpiresAt    string  `json:"expires_at"`
}

type AuthService struct {
	client          authv1.AuthServiceClient
	googleClientID  string
	devLoginEnabled bool
}

func NewAuthService(client authv1.AuthServiceClient, googleClientID string, devLoginEnabled bool) *AuthService {
	return &AuthService{
		client:          client,
		googleClientID:  googleClientID,
		devLoginEnabled: devLoginEnabled,
	}
}

func (s *AuthService) Config() AuthConfig {
	return AuthConfig{
		GoogleClientID:  s.googleClientID,
		DevLoginEnabled: s.devLoginEnabled,
	}
}

func (s *AuthService) CheckReady(ctx context.Context) error {
	_, err := s.client.ValidateSession(ctx, &authv1.ValidateSessionRequest{SessionToken: ""})
	return err
}

func toUserDTO(u *authv1.User) UserDTO {
	if u == nil {
		return UserDTO{}
	}
	return UserDTO{
		UserID:     u.GetUserId(),
		Email:      u.GetEmail(),
		Name:       u.GetName(),
		PictureURL: u.GetPictureUrl(),
	}
}

func (s *AuthService) SignInWithGoogle(ctx context.Context, idToken string) (SignInDTO, error) {
	resp, err := s.client.SignInWithGoogle(ctx, &authv1.SignInWithGoogleRequest{IdToken: idToken})
	if err != nil {
		return SignInDTO{}, err
	}
	return SignInDTO{
		User:         toUserDTO(resp.GetUser()),
		SessionToken: resp.GetSessionToken(),
		ExpiresAt:    resp.GetExpiresAt(),
	}, nil
}

func (s *AuthService) ValidateSession(ctx context.Context, token string) (UserDTO, bool, error) {
	resp, err := s.client.ValidateSession(ctx, &authv1.ValidateSessionRequest{SessionToken: token})
	if err != nil {
		return UserDTO{}, false, err
	}
	if !resp.GetValid() {
		return UserDTO{}, false, nil
	}
	return toUserDTO(resp.GetUser()), true, nil
}

func (s *AuthService) SignOut(ctx context.Context, token string) error {
	_, err := s.client.SignOut(ctx, &authv1.SignOutRequest{SessionToken: token})
	return err
}

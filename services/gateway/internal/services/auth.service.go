package services

import (
	"context"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	authv1 "github.com/kairos/gateway/gen/kairos/auth/v1"
)

type AuthConfig struct {
	GoogleClientID  string `json:"google_client_id"`
	DevLoginEnabled bool   `json:"dev_login_enabled"`
}

type UserDTO struct {
	UserID        string `json:"user_id"`
	Email         string `json:"email"`
	Name          string `json:"name"`
	PictureURL    string `json:"picture_url"`
	AvatarKey     string `json:"avatar_key"`
	Role          string `json:"role"`
	EmailVerified bool   `json:"email_verified"`
	GoogleLinked  bool   `json:"google_linked"`
	HasPassword   bool   `json:"has_password"`
}

type SignInDTO struct {
	User         UserDTO `json:"user"`
	SessionToken string  `json:"session_token"`
	ExpiresAt    string  `json:"expires_at"`
}

type RegisterDTO struct {
	Email              string `json:"email"`
	ResendAfterSeconds int64  `json:"resend_after_seconds"`
	ExpiresInSeconds   int64  `json:"expires_in_seconds"`
}

type OTPSentDTO struct {
	ResendAfterSeconds int64 `json:"resend_after_seconds"`
	ExpiresInSeconds   int64 `json:"expires_in_seconds"`
}

type ForgotPasswordDTO struct {
	Accepted           bool   `json:"accepted"`
	Message            string `json:"message"`
	ResendAfterSeconds int64  `json:"resend_after_seconds"`
}

type ServiceError struct {
	HTTPStatus int
	Code       string
	Message    string
	Email      string
	RetryAfter int64
}

func (e *ServiceError) Error() string {
	return e.Message
}

func ParseAuthError(err error) *ServiceError {
	if err == nil {
		return nil
	}
	var se *ServiceError
	if errors.As(err, &se) {
		return se
	}
	st, ok := status.FromError(err)
	if !ok {
		return &ServiceError{HTTPStatus: http.StatusBadGateway, Code: "AUTH_UNAVAILABLE", Message: err.Error()}
	}

	httpCode := http.StatusBadGateway
	switch st.Code() {
	case codes.Unauthenticated:
		httpCode = http.StatusUnauthorized
	case codes.AlreadyExists:
		httpCode = http.StatusConflict
	case codes.PermissionDenied:
		httpCode = http.StatusForbidden
	case codes.ResourceExhausted:
		httpCode = http.StatusTooManyRequests
	case codes.InvalidArgument:
		httpCode = http.StatusBadRequest
	}

	parts := strings.SplitN(st.Message(), "|", 4)
	if len(parts) == 4 {
		retry, _ := strconv.ParseInt(parts[1], 10, 64)
		return &ServiceError{
			HTTPStatus: httpCode,
			Code:       parts[0],
			RetryAfter: retry,
			Email:      parts[2],
			Message:    parts[3],
		}
	}

	return &ServiceError{
		HTTPStatus: httpCode,
		Code:       st.Code().String(),
		Message:    st.Message(),
	}
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
	role := u.GetRole()
	if role == "" {
		role = "user"
	}
	return UserDTO{
		UserID:        u.GetUserId(),
		Email:         u.GetEmail(),
		Name:          u.GetName(),
		PictureURL:    u.GetPictureUrl(),
		AvatarKey:     u.GetAvatarKey(),
		Role:          role,
		EmailVerified: u.GetEmailVerified(),
		GoogleLinked:  u.GetGoogleLinked(),
		HasPassword:   u.GetHasPassword(),
	}
}

func (s *AuthService) SignInWithGoogle(ctx context.Context, idToken string) (SignInDTO, error) {
	resp, err := s.client.SignInWithGoogle(ctx, &authv1.SignInWithGoogleRequest{IdToken: idToken})
	if err != nil {
		return SignInDTO{}, ParseAuthError(err)
	}
	return SignInDTO{
		User:         toUserDTO(resp.GetUser()),
		SessionToken: resp.GetSessionToken(),
		ExpiresAt:    resp.GetExpiresAt(),
	}, nil
}

func (s *AuthService) LinkGoogle(ctx context.Context, sessionToken, idToken string) (UserDTO, error) {
	resp, err := s.client.LinkGoogle(ctx, &authv1.LinkGoogleRequest{
		SessionToken: sessionToken,
		IdToken:      idToken,
	})
	if err != nil {
		return UserDTO{}, ParseAuthError(err)
	}
	return toUserDTO(resp.GetUser()), nil
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

func (s *AuthService) Register(ctx context.Context, name, email, password, confirm string) (RegisterDTO, error) {
	resp, err := s.client.Register(ctx, &authv1.RegisterRequest{
		Name:                 name,
		Email:                email,
		Password:             password,
		PasswordConfirmation: confirm,
	})
	if err != nil {
		return RegisterDTO{}, ParseAuthError(err)
	}
	return RegisterDTO{
		Email:              resp.GetEmail(),
		ResendAfterSeconds: resp.GetResendAfterSeconds(),
		ExpiresInSeconds:   resp.GetExpiresInSeconds(),
	}, nil
}

func (s *AuthService) VerifyOTP(ctx context.Context, email, purpose, code string) (SignInDTO, error) {
	resp, err := s.client.VerifyOTP(ctx, &authv1.VerifyOTPRequest{
		Email:   email,
		Purpose: purpose,
		Code:    code,
	})
	if err != nil {
		return SignInDTO{}, ParseAuthError(err)
	}
	return SignInDTO{
		User:         toUserDTO(resp.GetUser()),
		SessionToken: resp.GetSessionToken(),
		ExpiresAt:    resp.GetExpiresAt(),
	}, nil
}

func (s *AuthService) ResendOTP(ctx context.Context, email, purpose string) (OTPSentDTO, error) {
	resp, err := s.client.ResendOTP(ctx, &authv1.ResendOTPRequest{
		Email:   email,
		Purpose: purpose,
	})
	if err != nil {
		return OTPSentDTO{}, ParseAuthError(err)
	}
	return OTPSentDTO{
		ResendAfterSeconds: resp.GetResendAfterSeconds(),
		ExpiresInSeconds:   resp.GetExpiresInSeconds(),
	}, nil
}

func (s *AuthService) LoginWithPassword(ctx context.Context, email, password string) (SignInDTO, error) {
	resp, err := s.client.LoginWithPassword(ctx, &authv1.LoginWithPasswordRequest{
		Email:    email,
		Password: password,
	})
	if err != nil {
		return SignInDTO{}, ParseAuthError(err)
	}
	return SignInDTO{
		User:         toUserDTO(resp.GetUser()),
		SessionToken: resp.GetSessionToken(),
		ExpiresAt:    resp.GetExpiresAt(),
	}, nil
}

func (s *AuthService) ForgotPassword(ctx context.Context, email string) (ForgotPasswordDTO, error) {
	resp, err := s.client.ForgotPassword(ctx, &authv1.ForgotPasswordRequest{Email: email})
	if err != nil {
		return ForgotPasswordDTO{}, ParseAuthError(err)
	}
	return ForgotPasswordDTO{
		Accepted:           resp.GetAccepted(),
		Message:            "Jika email terdaftar, kami telah mengirim kode.",
		ResendAfterSeconds: resp.GetResendAfterSeconds(),
	}, nil
}

func (s *AuthService) ResetPassword(ctx context.Context, email, code, newPassword, confirm string) error {
	_, err := s.client.ResetPassword(ctx, &authv1.ResetPasswordRequest{
		Email:                email,
		Code:                 code,
		NewPassword:          newPassword,
		PasswordConfirmation: confirm,
	})
	if err != nil {
		return ParseAuthError(err)
	}
	return nil
}

func (s *AuthService) UpdateProfile(ctx context.Context, sessionToken, name, avatarKey string) (UserDTO, error) {
	resp, err := s.client.UpdateProfile(ctx, &authv1.UpdateProfileRequest{
		SessionToken: sessionToken,
		Name:         name,
		AvatarKey:    avatarKey,
	})
	if err != nil {
		return UserDTO{}, ParseAuthError(err)
	}
	return toUserDTO(resp.GetUser()), nil
}

func (s *AuthService) ChangePassword(ctx context.Context, sessionToken, currentPassword, newPassword, confirm string) error {
	_, err := s.client.ChangePassword(ctx, &authv1.ChangePasswordRequest{
		SessionToken:         sessionToken,
		CurrentPassword:      currentPassword,
		NewPassword:          newPassword,
		PasswordConfirmation: confirm,
	})
	if err != nil {
		return ParseAuthError(err)
	}
	return nil
}

func (s *AuthService) RequestSetPasswordOTP(ctx context.Context, sessionToken string) (RegisterDTO, error) {
	resp, err := s.client.RequestSetPasswordOTP(ctx, &authv1.RequestSetPasswordOTPRequest{
		SessionToken: sessionToken,
	})
	if err != nil {
		return RegisterDTO{}, ParseAuthError(err)
	}
	return RegisterDTO{
		Email:              resp.GetEmail(),
		ResendAfterSeconds: resp.GetResendAfterSeconds(),
		ExpiresInSeconds:   resp.GetExpiresInSeconds(),
	}, nil
}

func (s *AuthService) SetPassword(ctx context.Context, sessionToken, code, newPassword, confirm string) (UserDTO, error) {
	resp, err := s.client.SetPassword(ctx, &authv1.SetPasswordRequest{
		SessionToken:         sessionToken,
		Code:                 code,
		NewPassword:          newPassword,
		PasswordConfirmation: confirm,
	})
	if err != nil {
		return UserDTO{}, ParseAuthError(err)
	}
	return toUserDTO(resp.GetUser()), nil
}

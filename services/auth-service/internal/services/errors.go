package services

import (
	"errors"
	"fmt"
	"strings"
)

type DomainError struct {
	Code    string
	Message string
	Email   string
	Retry   int64
}

func (e *DomainError) Error() string {
	return fmt.Sprintf("%s: %s", e.Code, e.Message)
}

func newDomainErr(code, msg string) *DomainError {
	return &DomainError{Code: code, Message: msg}
}

var (
	ErrEmailExists         = newDomainErr("EMAIL_EXISTS", "Email ini sudah terdaftar")
	ErrEmailExistsGoogle   = newDomainErr("EMAIL_EXISTS_GOOGLE", "Email ini sudah terdaftar")
	ErrInvalidCredentials  = newDomainErr("INVALID_CREDENTIALS", "Email atau password salah")
	ErrGoogleOnlyAccount   = newDomainErr("GOOGLE_ONLY_ACCOUNT", "Akun ini terhubung dengan Google. Silakan masuk dengan Google, atau buat password lewat 'Lupa Password'.")
	ErrEmailNotVerified    = newDomainErr("EMAIL_NOT_VERIFIED", "Email belum terverifikasi. Kami telah mengirim kode OTP baru.")
	ErrInvalidOrExpiredOTP = newDomainErr("INVALID_OTP", "Kode salah atau sudah kedaluwarsa")
	ErrOTPCooldown         = newDomainErr("OTP_COOLDOWN", "Tunggu beberapa detik sebelum meminta kode baru.")
	ErrOTPRateLimited      = newDomainErr("OTP_RATE_LIMITED", "Batas pengiriman kode per jam telah tercapai. Coba lagi nanti.")
	ErrWeakPassword        = newDomainErr("WEAK_PASSWORD", "Password belum memenuhi kebijakan keamanan.")
	ErrPasswordMismatch    = newDomainErr("PASSWORD_MISMATCH", "Konfirmasi password tidak cocok.")
	ErrPasswordSameAsOld   = newDomainErr("PASSWORD_SAME_AS_OLD", "Password baru tidak boleh sama dengan password lama.")
	ErrPasswordAlreadySet  = newDomainErr("PASSWORD_ALREADY_SET", "Password sudah diatur untuk akun ini.")
	ErrInvalidName         = newDomainErr("INVALID_NAME", "Nama harus 2 hingga 50 karakter dan tidak boleh memuat karakter kontrol atau tag HTML.")
	ErrInvalidEmail        = newDomainErr("INVALID_EMAIL", "Format email tidak valid.")
	ErrInvalidAvatar       = newDomainErr("INVALID_AVATAR", "Pilihan avatar tidak valid.")
	ErrUnauthorized        = newDomainErr("UNAUTHORIZED", "Sesi tidak valid atau telah berakhir.")
	ErrGoogleEmailMismatch = newDomainErr("GOOGLE_EMAIL_MISMATCH", "Email akun Google harus sama dengan email akun ini.")
	ErrGoogleAlreadyLinked = newDomainErr("GOOGLE_ALREADY_LINKED", "Login via Google sudah aktif pada akun ini.")
)

// EncodeGRPCMessage formats a DomainError as CODE|retry|email|message so gateway parses exact error metadata.
func EncodeGRPCMessage(err error) string {
	var de *DomainError
	if errors.As(err, &de) {
		return fmt.Sprintf("%s|%d|%s|%s", de.Code, de.Retry, de.Email, de.Message)
	}
	return "INTERNAL|0||" + err.Error()
}

// ParseDomainCode helper for tests and internal checks.
func HasErrorCode(err error, code string) bool {
	var de *DomainError
	if errors.As(err, &de) {
		return strings.EqualFold(de.Code, code)
	}
	return false
}

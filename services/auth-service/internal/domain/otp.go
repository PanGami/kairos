package domain

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"math/big"
	"strings"
)

const (
	OTPPurposeRegister    = "register_verify"
	OTPPurposeReset       = "reset_password"
	OTPPurposeSetPassword = "set_password"
)

// IsValidOTPPurpose checks whether an OTP purpose matches a supported auth flow.
func IsValidOTPPurpose(purpose string) bool {
	switch purpose {
	case OTPPurposeRegister, OTPPurposeReset, OTPPurposeSetPassword:
		return true
	default:
		return false
	}
}

// GenerateOTPCode returns a cryptographically random 6-digit numeric code.
func GenerateOTPCode() (string, error) {
	n, err := rand.Int(rand.Reader, big.NewInt(1_000_000))
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%06d", n.Int64()), nil
}

// HashOTP derives a scoped SHA-256 digest so OTP codes are never stored in plaintext.
func HashOTP(email, purpose, code string) string {
	payload := strings.ToLower(strings.TrimSpace(email)) + "|" + strings.TrimSpace(purpose) + "|" + strings.TrimSpace(code)
	sum := sha256.Sum256([]byte(payload))
	return hex.EncodeToString(sum[:])
}

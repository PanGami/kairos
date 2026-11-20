package domain

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"
	"unicode"
	"unicode/utf8"

	"golang.org/x/crypto/argon2"
)

var (
	ErrWeakPassword = errors.New("password does not satisfy security policy")
)

const (
	argonTime    uint32 = 1
	argonMemory  uint32 = 64 * 1024
	argonThreads uint8  = 4
	argonKeyLen  uint32 = 32
	argonSaltLen        = 16
)

// HashPassword hashes a plaintext password using Argon2id with a 16-byte random salt.
func HashPassword(password string) (string, error) {
	salt := make([]byte, argonSaltLen)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}
	hash := argon2.IDKey([]byte(password), salt, argonTime, argonMemory, argonThreads, argonKeyLen)
	b64Salt := base64.RawStdEncoding.EncodeToString(salt)
	b64Hash := base64.RawStdEncoding.EncodeToString(hash)
	return fmt.Sprintf("$argon2id$v=%d$m=%d,t=%d,p=%d$%s$%s",
		argon2.Version, argonMemory, argonTime, argonThreads, b64Salt, b64Hash), nil
}

// VerifyPassword verifies a plaintext password against a stored Argon2id PHC hash.
func VerifyPassword(password, encoded string) bool {
	parts := strings.Split(encoded, "$")
	if len(parts) != 6 || parts[1] != "argon2id" {
		return false
	}
	var version int
	if _, err := fmt.Sscanf(parts[2], "v=%d", &version); err != nil || version != argon2.Version {
		return false
	}
	var memory, timeCost uint32
	var threads uint8
	if _, err := fmt.Sscanf(parts[3], "m=%d,t=%d,p=%d", &memory, &timeCost, &threads); err != nil {
		return false
	}
	salt, err := base64.RawStdEncoding.DecodeString(parts[4])
	if err != nil {
		return false
	}
	expectedHash, err := base64.RawStdEncoding.DecodeString(parts[5])
	if err != nil {
		return false
	}
	computed := argon2.IDKey([]byte(password), salt, timeCost, memory, threads, uint32(len(expectedHash)))
	return subtle.ConstantTimeCompare(computed, expectedHash) == 1
}

// ValidatePasswordPolicy enforces complexity, length, personal-identifier exclusion, and leaked-password checks.
func ValidatePasswordPolicy(password, email, name string) error {
	runeLen := utf8.RuneCountInString(password)
	if runeLen < 8 || runeLen > 128 {
		return ErrWeakPassword
	}

	var hasUpper, hasLower, hasDigit, hasSymbol bool
	for _, r := range password {
		switch {
		case unicode.IsUpper(r):
			hasUpper = true
		case unicode.IsLower(r):
			hasLower = true
		case unicode.IsDigit(r):
			hasDigit = true
		case unicode.IsPunct(r) || unicode.IsSymbol(r):
			hasSymbol = true
		}
	}
	if !hasUpper || !hasLower || !hasDigit || !hasSymbol {
		return ErrWeakPassword
	}

	lowerPw := strings.ToLower(password)
	normEmail := strings.ToLower(strings.TrimSpace(email))
	if normEmail != "" {
		if strings.Contains(lowerPw, normEmail) {
			return ErrWeakPassword
		}
		local := strings.Split(normEmail, "@")[0]
		if len(local) >= 3 && strings.Contains(lowerPw, local) {
			return ErrWeakPassword
		}
	}

	for _, tok := range strings.Fields(strings.ToLower(name)) {
		if len(tok) >= 3 && strings.Contains(lowerPw, tok) {
			return ErrWeakPassword
		}
	}

	if isCommonPassword(password) {
		return ErrWeakPassword
	}
	return nil
}

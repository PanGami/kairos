// Package domain implements pure validation, password hashing, and OTP helpers decoupled from I/O.
package domain

import (
	"crypto/rand"
	"errors"
	"math/big"
	"net/mail"
	"regexp"
	"strings"
	"unicode"
	"unicode/utf8"
)

var (
	ErrInvalidEmail  = errors.New("invalid email address")
	ErrInvalidName   = errors.New("invalid display name")
	ErrInvalidAvatar = errors.New("invalid avatar key")
)

var ValidAvatarKeys = []string{
	"avatar-1",
	"avatar-2",
	"avatar-3",
	"avatar-4",
	"avatar-5",
	"avatar-6",
	"avatar-7",
	"avatar-8",
	"avatar-9",
}

var (
	multiSpaceRe = regexp.MustCompile(`\s+`)
	emailDomain  = regexp.MustCompile(`^[a-z0-9.-]+\.[a-z]{2,}$`)
)

// NormalizeEmail trims, lowercases, and strictly validates an email address.
func NormalizeEmail(raw string) (string, error) {
	cleaned := strings.ToLower(strings.TrimSpace(raw))
	if cleaned == "" || len(cleaned) > 254 || strings.ContainsAny(cleaned, " \t\r\n<>") {
		return "", ErrInvalidEmail
	}
	addr, err := mail.ParseAddress(cleaned)
	if err != nil || strings.ToLower(addr.Address) != cleaned {
		return "", ErrInvalidEmail
	}
	parts := strings.Split(cleaned, "@")
	if len(parts) != 2 || parts[0] == "" || !emailDomain.MatchString(parts[1]) {
		return "", ErrInvalidEmail
	}
	return cleaned, nil
}

// SanitizeAndValidateName trims ends, collapses consecutive spaces, and rejects control chars and HTML tags.
func SanitizeAndValidateName(raw string) (string, error) {
	for _, r := range raw {
		if unicode.IsControl(r) || r == '<' || r == '>' {
			return "", ErrInvalidName
		}
	}
	collapsed := strings.TrimSpace(multiSpaceRe.ReplaceAllString(raw, " "))
	length := utf8.RuneCountInString(collapsed)
	if length < 2 || length > 50 {
		return "", ErrInvalidName
	}
	return collapsed, nil
}

// ValidateAvatarKey ensures the avatar key belongs to the allowed static set and returns its public asset path.
func ValidateAvatarKey(key string) (string, bool) {
	cleaned := strings.TrimSpace(key)
	for _, valid := range ValidAvatarKeys {
		if cleaned == valid {
			return "/avatars/" + valid + ".png", true
		}
	}
	return "", false
}

// RandomAvatarKey selects one of the 9 static avatar keys using crypto/rand.
func RandomAvatarKey() string {
	n, err := rand.Int(rand.Reader, big.NewInt(int64(len(ValidAvatarKeys))))
	if err != nil {
		return ValidAvatarKeys[0]
	}
	return ValidAvatarKeys[n.Int64()]
}

// DefaultGoogleName extracts a safe initial display name for a new Google account,
// falling back to the email local-part instead of empty or literal "gmail".
func DefaultGoogleName(googleName, email string) string {
	cleaned := strings.TrimSpace(multiSpaceRe.ReplaceAllString(googleName, " "))
	if cleaned != "" && !strings.EqualFold(cleaned, "gmail") {
		if safe, err := SanitizeAndValidateName(cleaned); err == nil {
			return safe
		}
	}
	local := strings.Split(email, "@")[0]
	var b strings.Builder
	for _, r := range local {
		if !unicode.IsControl(r) && r != '<' && r != '>' {
			b.WriteRune(r)
		}
	}
	fallback := strings.TrimSpace(b.String())
	if utf8.RuneCountInString(fallback) < 2 {
		return "Kairos User"
	}
	runes := []rune(fallback)
	if len(runes) > 50 {
		return string(runes[:50])
	}
	return fallback
}

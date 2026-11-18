package domain

import (
	"strings"
	"testing"
)

func TestNormalizeEmail(t *testing.T) {
	got, err := NormalizeEmail("  Alice.Investor@Example.COM ")
	if err != nil || got != "alice.investor@example.com" {
		t.Fatalf("unexpected normalize result: got=%q err=%v", got, err)
	}
	for _, bad := range []string{"", "not-an-email", "a@localhost", "Alice <a@b.com>", "a b@c.com"} {
		if _, err := NormalizeEmail(bad); err == nil {
			t.Fatalf("expected invalid email rejection for %q", bad)
		}
	}
}

func TestSanitizeAndValidateName(t *testing.T) {
	got, err := SanitizeAndValidateName("  Budi   Santoso  ")
	if err != nil || got != "Budi Santoso" {
		t.Fatalf("expected collapsed name, got=%q err=%v", got, err)
	}
	for _, bad := range []string{"A", strings.Repeat("a", 51), "<script>x</script>", "Bob\x00Smith", "Test\nName"} {
		if _, err := SanitizeAndValidateName(bad); err == nil {
			t.Fatalf("expected name rejection for %q", bad)
		}
	}
}

func TestDefaultGoogleNameNeverGmail(t *testing.T) {
	if got := DefaultGoogleName("gmail", "rahmat.hidayat@gmail.com"); got != "rahmat.hidayat" {
		t.Fatalf("expected local-part fallback for literal gmail, got %q", got)
	}
	if got := DefaultGoogleName("  GMAIL ", "siti@kairos.id"); got != "siti" {
		t.Fatalf("expected case-insensitive gmail rejection, got %q", got)
	}
	if got := DefaultGoogleName("", "andi@example.com"); got != "andi" {
		t.Fatalf("expected empty google name fallback, got %q", got)
	}
	if got := DefaultGoogleName("Siti Aminah", "siti@gmail.com"); got != "Siti Aminah" {
		t.Fatalf("expected preserved Google display name, got %q", got)
	}
}

func TestValidatePasswordPolicyAndArgon2(t *testing.T) {
	if err := ValidatePasswordPolicy("Kestrel#Maple92!", "budi@example.com", "Budi Santoso"); err != nil {
		t.Fatalf("expected strong password to pass, got %v", err)
	}
	cases := []struct {
		pw   string
		desc string
	}{
		{"Ab1!", "too short"},
		{"lowercase123!", "missing upper"},
		{"UPPERCASE123!", "missing lower"},
		{"NoDigitsHere!", "missing digit"},
		{"NoSymbols1234", "missing symbol"},
		{"Budi#Strong99!", "contains user name"},
		{"Mybudi@example.com1!", "contains email"},
		{"budi2026#Strong!", "contains email local-part"},
		{"Password123!", "common breached password"},
	}
	for _, tc := range cases {
		if err := ValidatePasswordPolicy(tc.pw, "budi@example.com", "Budi Santoso"); err == nil {
			t.Fatalf("expected policy rejection for %s (%q)", tc.desc, tc.pw)
		}
	}

	hash, err := HashPassword("Kestrel#Maple92!")
	if err != nil {
		t.Fatalf("HashPassword failed: %v", err)
	}
	if !strings.HasPrefix(hash, "$argon2id$") {
		t.Fatalf("expected argon2id PHC hash, got %q", hash)
	}
	if !VerifyPassword("Kestrel#Maple92!", hash) {
		t.Fatalf("expected VerifyPassword to succeed")
	}
	if VerifyPassword("WrongPassword1!", hash) {
		t.Fatalf("expected VerifyPassword to reject wrong password")
	}
}

func TestGenerateOTPAndAvatarValidation(t *testing.T) {
	code, err := GenerateOTPCode()
	if err != nil || len(code) != 6 {
		t.Fatalf("expected 6-digit OTP, got=%q err=%v", code, err)
	}
	for _, r := range code {
		if r < '0' || r > '9' {
			t.Fatalf("non-digit in OTP %q", code)
		}
	}
	if p, ok := ValidateAvatarKey("avatar-5"); !ok || p != "/avatars/avatar-5.png" {
		t.Fatalf("unexpected avatar-5 validation: %q %v", p, ok)
	}
	if _, ok := ValidateAvatarKey("avatar-99"); ok {
		t.Fatalf("expected invalid avatar key rejection")
	}
	rk := RandomAvatarKey()
	if _, ok := ValidateAvatarKey(rk); !ok {
		t.Fatalf("RandomAvatarKey returned invalid key %q", rk)
	}
}

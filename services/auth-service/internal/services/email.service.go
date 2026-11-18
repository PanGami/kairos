package services

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"html"
	"log/slog"
	"mime"
	"net"
	"net/mail"
	"net/smtp"
	"strings"
	"time"
)

type EmailSender interface {
	SendVerificationOTP(ctx context.Context, toEmail, code string) error
	SendResetPasswordOTP(ctx context.Context, toEmail, code string) error
	SendSetPasswordOTP(ctx context.Context, toEmail, code string) error
	SendPasswordChangedNotice(ctx context.Context, toEmail string, changedAt time.Time) error
}

// SMTPEmailService sends transactional English emails via SMTP (e.g. Google Gmail SMTP).
// When SMTP credentials are not configured, emails are emitted to structured stdout logs for local dev.
type SMTPEmailService struct {
	Host     string
	Port     string
	User     string
	Password string
	From     string
	SendMail func(addr string, a smtp.Auth, from string, to []string, msg []byte) error
}

func NewSMTPEmailService(host, port, user, password, from string) *SMTPEmailService {
	cleanHost := strings.TrimSpace(host)
	if cleanHost == "" {
		cleanHost = "smtp.gmail.com"
	}
	cleanPort := strings.TrimSpace(port)
	if cleanPort == "" {
		cleanPort = "587"
	}
	cleanUser := strings.TrimSpace(user)
	cleanFrom := strings.TrimSpace(from)
	if cleanFrom == "" {
		if cleanUser != "" {
			cleanFrom = fmt.Sprintf("Kairos <%s>", cleanUser)
		} else {
			cleanFrom = "Kairos <noreply@kairos>"
		}
	}
	return &SMTPEmailService{
		Host:     cleanHost,
		Port:     cleanPort,
		User:     cleanUser,
		Password: password,
		From:     cleanFrom,
		SendMail: smtp.SendMail,
	}
}

func renderEmailLayout(title, intro, code, warning, footerNote string) (string, string) {
	safeTitle := html.EscapeString(title)
	safeIntro := html.EscapeString(intro)
	safeWarning := html.EscapeString(warning)
	safeFooter := html.EscapeString(footerNote)

	codeBlockHTML := ""
	codeText := ""
	if code != "" {
		safeCode := html.EscapeString(code)
		codeBlockHTML = fmt.Sprintf(`
<div style="margin:24px 0;padding:18px 20px;background:#121212;border:1px solid #2A2A2A;border-radius:8px;text-align:center;">
  <span style="font-family:'JetBrains Mono',monospace;font-size:28px;font-weight:700;letter-spacing:0.22em;color:#00AB6B;">%s</span>
</div>`, safeCode)
		codeText = "\nVerification code: " + code + "\n"
	}

	warningHTML := ""
	warningText := ""
	if warning != "" {
		warningHTML = fmt.Sprintf(`<p style="margin:0 0 14px;font-size:13px;line-height:1.5;color:#F59E0B;font-weight:600;">%s</p>`, safeWarning)
		warningText = "\n" + warning + "\n"
	}

	htmlBody := fmt.Sprintf(`<!doctype html>
<html lang="en">
<body style="margin:0;padding:24px;background:#121212;font-family:'Plus Jakarta Sans',Helvetica,Arial,sans-serif;color:#F3F4F6;">
  <div style="max-width:520px;margin:0 auto;background:#181818;border:1px solid #2A2A2A;border-radius:8px;padding:28px;">
    <div style="padding-bottom:16px;margin-bottom:20px;border-bottom:1px solid #2A2A2A;">
      <strong style="font-size:16px;letter-spacing:0.14em;color:#F3F4F6;">KAIROS</strong>
      <span style="display:block;margin-top:4px;font-size:11px;letter-spacing:0.08em;color:#9CA3AF;">END-OF-DAY RISK MONITOR</span>
    </div>
    <h1 style="margin:0 0 12px;font-size:20px;line-height:1.3;color:#F3F4F6;">%s</h1>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#D1D5DB;">%s</p>
    %s
    %s
    <p style="margin:0;font-size:13px;line-height:1.5;color:#9CA3AF;">%s</p>
  </div>
</body>
</html>`, safeTitle, safeIntro, codeBlockHTML, warningHTML, safeFooter)

	textBody := fmt.Sprintf("KAIROS | END-OF-DAY RISK MONITOR\n\n%s\n\n%s\n%s%s\n%s\n", title, intro, codeText, warningText, footerNote)
	return htmlBody, textBody
}

func randomBoundary() string {
	var b [12]byte
	if _, err := rand.Read(b[:]); err != nil {
		return "kairos-mime-boundary"
	}
	return "kairos-" + hex.EncodeToString(b[:])
}

func sanitizeHeaderValue(v string) string {
	return strings.NewReplacer("\r", "", "\n", "").Replace(v)
}

func buildMIMEMessage(fromHeader, toEmail, subject, textBody, htmlBody string) []byte {
	boundary := randomBoundary()
	var buf bytes.Buffer
	fmt.Fprintf(&buf, "From: %s\r\n", sanitizeHeaderValue(fromHeader))
	fmt.Fprintf(&buf, "To: %s\r\n", sanitizeHeaderValue(toEmail))
	fmt.Fprintf(&buf, "Subject: %s\r\n", mime.QEncoding.Encode("utf-8", sanitizeHeaderValue(subject)))
	fmt.Fprintf(&buf, "MIME-Version: 1.0\r\n")
	fmt.Fprintf(&buf, "Content-Type: multipart/alternative; boundary=\"%s\"\r\n\r\n", boundary)

	fmt.Fprintf(&buf, "--%s\r\n", boundary)
	fmt.Fprintf(&buf, "Content-Type: text/plain; charset=\"utf-8\"\r\n\r\n")
	buf.WriteString(strings.ReplaceAll(textBody, "\n", "\r\n"))
	buf.WriteString("\r\n")

	fmt.Fprintf(&buf, "--%s\r\n", boundary)
	fmt.Fprintf(&buf, "Content-Type: text/html; charset=\"utf-8\"\r\n\r\n")
	buf.WriteString(strings.ReplaceAll(htmlBody, "\n", "\r\n"))
	buf.WriteString("\r\n")

	fmt.Fprintf(&buf, "--%s--\r\n", boundary)
	return buf.Bytes()
}

func (s *SMTPEmailService) envelopeFrom() string {
	if addr, err := mail.ParseAddress(s.From); err == nil && addr.Address != "" {
		return addr.Address
	}
	return s.User
}

func (s *SMTPEmailService) send(ctx context.Context, toEmail, subject, htmlBody, textBody, devNote string) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	if s.User == "" || s.Password == "" {
		slog.Info("auth.email.dev_outbox",
			"from", s.From,
			"to", toEmail,
			"subject", subject,
			"detail", devNote,
		)
		return nil
	}

	addr := net.JoinHostPort(s.Host, s.Port)
	auth := smtp.PlainAuth("", s.User, s.Password, s.Host)
	msg := buildMIMEMessage(s.From, toEmail, subject, textBody, htmlBody)

	sendFn := s.SendMail
	if sendFn == nil {
		sendFn = smtp.SendMail
	}
	if err := sendFn(addr, auth, s.envelopeFrom(), []string{toEmail}, msg); err != nil {
		return fmt.Errorf("send smtp email: %w", err)
	}
	return nil
}

func (s *SMTPEmailService) SendVerificationOTP(ctx context.Context, toEmail, code string) error {
	htmlBody, textBody := renderEmailLayout(
		"Verify your Kairos email address",
		"Enter the 6-digit verification code below to activate your Kairos account. This code is valid for 10 minutes and can only be used once.",
		code,
		"Never share this code with anyone.",
		"If you did not create a Kairos account, you can safely ignore this message.",
	)
	return s.send(ctx, toEmail, "Your Kairos verification code", htmlBody, textBody, "otp="+code)
}

func (s *SMTPEmailService) SendResetPasswordOTP(ctx context.Context, toEmail, code string) error {
	htmlBody, textBody := renderEmailLayout(
		"Reset your Kairos password",
		"Use the 6-digit verification code below to reset your Kairos password. This code expires in 10 minutes and can only be used once.",
		code,
		"Never share this code with anyone.",
		"If you did not request a password reset, please ignore this email. Your existing password will remain unchanged.",
	)
	return s.send(ctx, toEmail, "Reset your Kairos password", htmlBody, textBody, "otp="+code)
}

func (s *SMTPEmailService) SendSetPasswordOTP(ctx context.Context, toEmail, code string) error {
	htmlBody, textBody := renderEmailLayout(
		"Confirm password setup for Kairos",
		"Use the 6-digit verification code below to confirm setting up a password for your Kairos account. This code expires in 10 minutes.",
		code,
		"Never share this code with anyone.",
		"If you did not request this change from your Kairos profile, please ignore this email.",
	)
	return s.send(ctx, toEmail, "Confirm password setup for Kairos", htmlBody, textBody, "otp="+code)
}

func (s *SMTPEmailService) SendPasswordChangedNotice(ctx context.Context, toEmail string, changedAt time.Time) error {
	ts := changedAt.UTC().Format("2006-01-02 15:04:05 UTC")
	htmlBody, textBody := renderEmailLayout(
		"Your Kairos password was changed",
		fmt.Sprintf("Your Kairos account password was updated on %s.", ts),
		"",
		"",
		"If you did not make this change, contact support immediately and reset your password.",
	)
	return s.send(ctx, toEmail, "Your Kairos password was changed", htmlBody, textBody, "changed_at="+ts)
}

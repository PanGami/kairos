import { useEffect, useId, useState, type FormEvent } from "react";
import { useLocale } from "../../hooks/useLocale";
import { ApiError } from "../../services/api.client";
import * as authService from "../../services/auth.service";
import type { OTPPurpose } from "../../types/api.types";

interface OtpVerificationViewProps {
  email: string;
  purpose: Extract<OTPPurpose, "register_verify">;
  title: string;
  initialCooldownSeconds?: number;
  initialInfoBanner?: string | null;
  onVerify: (code: string) => Promise<void>;
  onBack: () => void;
}

export function OtpVerificationView({
  email,
  purpose,
  title,
  initialCooldownSeconds = 60,
  initialInfoBanner = null,
  onVerify,
  onBack,
}: OtpVerificationViewProps) {
  const { t } = useLocale();
  const copy = t.authUi;
  const otpInputId = useId();

  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(initialCooldownSeconds);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(initialInfoBanner);

  useEffect(() => {
    setCountdown(initialCooldownSeconds);
  }, [initialCooldownSeconds]);

  useEffect(() => {
    if (countdown <= 0) return;
    const id = window.setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [countdown]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const cleaned = code.replace(/\D/g, "").slice(0, 6);
    if (cleaned.length !== 6) {
      setError(copy.otp.invalidCodeError);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onVerify(cleaned);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.code === "INVALID_OTP") {
        setError(copy.otp.invalidCodeError);
      } else {
        setError(err instanceof Error ? err.message : copy.otp.invalidCodeError);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    if (countdown > 0 || resending) return;
    setResending(true);
    setError(null);
    setInfo(null);
    try {
      const res = await authService.resendOtp({ email, purpose });
      setCountdown(res.resend_after_seconds || 60);
      setInfo(copy.otp.resentBanner);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.retryAfterSeconds) {
        setCountdown(err.retryAfterSeconds);
      }
      setError(err instanceof Error ? err.message : copy.otp.invalidCodeError);
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="auth-step-stack">
      <div className="auth-card-head">
        <span className="pill pill-cyan">OTP 6 DIGIT</span>
        <h1>{title}</h1>
        <p className="muted">{copy.otp.description(email)}</p>
        <p className="auth-meta-note">{copy.otp.validityNote}</p>
      </div>

      {info && (
        <div className="banner banner-info" role="status">
          {info}
        </div>
      )}

      {error && (
        <div className="banner banner-error" role="alert">
          {error}
        </div>
      )}

      <form className="auth-form" onSubmit={(e) => void handleSubmit(e)} noValidate>
        <div className="form-field">
          <label htmlFor={otpInputId} className="form-label">
            {copy.common.otpLabel}
          </label>
          <input
            id={otpInputId}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            className="form-input form-input-otp mono"
            placeholder={copy.common.otpPlaceholder}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary btn-full" disabled={submitting || code.length !== 6}>
          {submitting ? copy.otp.verifying : copy.otp.verifyButton}
        </button>
      </form>

      <div className="auth-inline-actions">
        <button
          type="button"
          className="btn btn-ghost"
          disabled={countdown > 0 || resending}
          onClick={() => void handleResend()}
        >
          {countdown > 0 ? copy.otp.resendCountdown(countdown) : copy.otp.resendButton}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          {copy.common.backAction}
        </button>
      </div>
    </div>
  );
}

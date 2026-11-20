import { useEffect, useId, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PasswordChecklist } from "../components/auth/PasswordChecklist";
import { PasswordInput } from "../components/auth/PasswordInput";
import { TurnstileWidget } from "../components/auth/TurnstileWidget";
import { useAuth } from "../hooks/useAuth";
import { useLocale } from "../hooks/useLocale";
import { ApiError } from "../services/api.client";
import * as authService from "../services/auth.service";
import { evaluatePasswordPolicy } from "../utils/passwordPolicy";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { config, clearLocalSession } = useAuth();
  const { t } = useLocale();
  const copy = t.authUi;

  const emailId = useId();
  const otpId = useId();
  const newPwId = useId();
  const confirmId = useId();

  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (countdown <= 0) return;
    const id = window.setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [countdown]);

  const cleanEmail = email.trim().toLowerCase();
  const policy = evaluatePasswordPolicy(newPassword, cleanEmail, "");

  async function handleRequestReset(event: FormEvent) {
    event.preventDefault();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError(copy.common.emailPlaceholder);
      return;
    }

    const captchaRequired = Boolean(config?.turnstile_site_key?.trim());
    if (captchaRequired && !captchaToken) {
      setError(copy.common.captchaRequiredError);
      return;
    }

    setSubmitting(true);
    setError(null);
    setInfo(null);
    try {
      const res = await authService.forgotPassword(cleanEmail, captchaToken ?? undefined);
      setInfo(copy.forgotPage.uniformSentBanner);
      setCountdown(res.resend_after_seconds || 60);
      setStep("reset");
    } catch (err: unknown) {
      setCaptchaResetKey((k) => k + 1);
      setError(err instanceof Error ? err.message : copy.common.emailPlaceholder);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    if (countdown > 0 || resending) return;
    setResending(true);
    setError(null);
    try {
      const res = await authService.resendOtp({ email: cleanEmail, purpose: "reset_password" });
      setCountdown(res.resend_after_seconds || 60);
      setInfo(copy.forgotPage.uniformSentBanner);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.retryAfterSeconds) {
        setCountdown(err.retryAfterSeconds);
      }
      setError(err instanceof Error ? err.message : copy.otp.invalidCodeError);
    } finally {
      setResending(false);
    }
  }

  async function handleResetSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const cleanedOtp = code.replace(/\D/g, "").slice(0, 6);
    if (cleanedOtp.length !== 6) {
      setError(copy.otp.invalidCodeError);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(copy.passwordPolicy.mismatchError);
      return;
    }
    if (!policy.allPassed) {
      setError(copy.passwordPolicy.policyError);
      return;
    }

    setSubmitting(true);
    try {
      await authService.resetPassword({
        email: cleanEmail,
        code: cleanedOtp,
        new_password: newPassword,
        password_confirmation: confirmPassword,
      });
      clearLocalSession();
      navigate("/login?reset=success", { replace: true });
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

  return (
    <div className="login-shell">
      <div className="login-card login-card-wide">
        <div className="auth-card-head">
          <span className="pill pill-cyan">{copy.forgotPage.badge}</span>
          <h1>{copy.forgotPage.title}</h1>
          <p className="muted">
            {step === "email" ? copy.forgotPage.step1Desc : copy.forgotPage.step2Desc(cleanEmail)}
          </p>
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

        {step === "email" ? (
          <form className="auth-form" onSubmit={(e) => void handleRequestReset(e)} noValidate>
            <div className="form-field">
              <label htmlFor={emailId} className="form-label">
                {copy.common.emailLabel}
              </label>
              <input
                id={emailId}
                type="email"
                autoComplete="email"
                className="form-input"
                placeholder={copy.common.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <TurnstileWidget
              resetKey={captchaResetKey}
              onTokenChange={setCaptchaToken}
              onError={setError}
            />

            <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
              {submitting ? copy.forgotPage.sendingCode : copy.forgotPage.sendCodeButton}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={(e) => void handleResetSubmit(e)} noValidate>
            <div className="form-field">
              <div className="form-label-row">
                <label htmlFor={otpId} className="form-label">
                  {copy.common.otpLabel}
                </label>
                <button
                  type="button"
                  className="btn-inline-toggle"
                  disabled={countdown > 0 || resending}
                  onClick={() => void handleResend()}
                >
                  {countdown > 0 ? copy.otp.resendCountdown(countdown) : copy.otp.resendButton}
                </button>
              </div>
              <input
                id={otpId}
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

            <div className="form-field">
              <label htmlFor={newPwId} className="form-label">
                {copy.common.newPasswordLabel}
              </label>
              <PasswordInput
                id={newPwId}
                autoComplete="new-password"
                value={newPassword}
                onChange={setNewPassword}
              />
            </div>

            <div className="form-field">
              <label htmlFor={confirmId} className="form-label">
                {copy.common.confirmPasswordLabel}
              </label>
              <PasswordInput
                id={confirmId}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={setConfirmPassword}
              />
            </div>

            <PasswordChecklist password={newPassword} email={cleanEmail} name="" />

            <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
              {submitting ? copy.forgotPage.resetting : copy.forgotPage.submitResetButton}
            </button>

            <button
              type="button"
              className="btn btn-ghost btn-full"
              onClick={() => {
                setStep("email");
                setError(null);
              }}
            >
              {copy.forgotPage.backToEmailStep}
            </button>
          </form>
        )}

        <p className="auth-switch-note">
          <Link to="/login" className="auth-inline-link">
            {copy.forgotPage.backToLogin}
          </Link>
        </p>
      </div>
    </div>
  );
}

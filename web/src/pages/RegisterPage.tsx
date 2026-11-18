import { useId, useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { PageSkeleton } from "../components/LoadingSkeleton";
import { OtpVerificationView } from "../components/auth/OtpVerificationView";
import { PasswordChecklist } from "../components/auth/PasswordChecklist";
import { PasswordInput } from "../components/auth/PasswordInput";
import { TurnstileWidget } from "../components/auth/TurnstileWidget";
import { useAuth } from "../hooks/useAuth";
import { useLocale } from "../hooks/useLocale";
import { ApiError } from "../services/api.client";
import * as authService from "../services/auth.service";
import { evaluatePasswordPolicy, isValidDisplayName, normalizeDisplayName } from "../utils/passwordPolicy";

export function RegisterPage() {
  const { user, loading, config, verifyOtp } = useAuth();
  const { t } = useLocale();
  const copy = t.authUi;

  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const confirmId = useId();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailExistsError, setEmailExistsError] = useState<string | null>(null);
  const [pendingOtp, setPendingOtp] = useState<{ email: string; cooldown: number } | null>(null);

  if (loading) {
    return <PageSkeleton variant="auth" label={t.login.checkingAuth} />;
  }
  if (user) {
    return <Navigate to="/watcher" replace />;
  }

  const policy = evaluatePasswordPolicy(password, email, name);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setEmailExistsError(null);

    if (!isValidDisplayName(name)) {
      setError(copy.registerPage.invalidNameError);
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError(copy.common.emailPlaceholder);
      return;
    }
    if (password !== confirmPassword) {
      setError(copy.passwordPolicy.mismatchError);
      return;
    }
    if (!policy.allPassed) {
      setError(copy.passwordPolicy.policyError);
      return;
    }
    const captchaRequired = Boolean(config?.turnstile_site_key?.trim());
    if (captchaRequired && !captchaToken) {
      setError(copy.common.captchaRequiredError);
      return;
    }

    setSubmitting(true);
    try {
      const res = await authService.registerAccount({
        name: normalizeDisplayName(name),
        email: cleanEmail,
        password,
        password_confirmation: confirmPassword,
        captcha_token: captchaToken ?? undefined,
      });
      setPendingOtp({
        email: res.email,
        cooldown: res.resend_after_seconds || 60,
      });
    } catch (err: unknown) {
      setCaptchaResetKey((k) => k + 1);
      if (err instanceof ApiError) {
        if (err.code === "EMAIL_EXISTS" || err.code === "EMAIL_EXISTS_GOOGLE" || err.status === 409) {
          setEmailExistsError(copy.registerPage.duplicateEmail);
          return;
        }
      }
      setError(err instanceof Error ? err.message : copy.passwordPolicy.policyError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card login-card-wide">
        {pendingOtp ? (
          <OtpVerificationView
            email={pendingOtp.email}
            purpose="register_verify"
            title={copy.otp.titleRegister}
            initialCooldownSeconds={pendingOtp.cooldown}
            onVerify={(code) => verifyOtp(pendingOtp.email, "register_verify", code)}
            onBack={() => setPendingOtp(null)}
          />
        ) : (
          <>
            <div className="auth-card-head">
              <span className="pill pill-cyan">{copy.registerPage.badge}</span>
              <h1>{copy.registerPage.title}</h1>
              <p className="muted">{copy.registerPage.description}</p>
            </div>

            {error && (
              <div className="banner banner-error" role="alert">
                <p className="banner-text">{error}</p>
              </div>
            )}

            <form className="auth-form" onSubmit={(e) => void handleSubmit(e)} noValidate>
              <div className="form-field">
                <label htmlFor={nameId} className="form-label">
                  {copy.common.nameLabel}
                </label>
                <input
                  id={nameId}
                  type="text"
                  autoComplete="name"
                  maxLength={50}
                  className="form-input"
                  placeholder={copy.common.namePlaceholder}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

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
                  aria-invalid={Boolean(emailExistsError)}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailExistsError) setEmailExistsError(null);
                  }}
                  required
                />
                {emailExistsError && (
                  <p className="field-error-text" role="alert">
                    {emailExistsError}
                  </p>
                )}
              </div>

              <div className="form-field">
                <label htmlFor={passwordId} className="form-label">
                  {copy.common.passwordLabel}
                </label>
                <PasswordInput
                  id={passwordId}
                  autoComplete="new-password"
                  value={password}
                  onChange={setPassword}
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

              <PasswordChecklist password={password} email={email} name={name} />

              <TurnstileWidget
                resetKey={captchaResetKey}
                onTokenChange={setCaptchaToken}
                onError={setError}
              />

              <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
                {submitting ? copy.registerPage.submitting : copy.registerPage.submitButton}
              </button>
            </form>

            <p className="auth-switch-note">
              <span>{copy.registerPage.loginPrompt}</span>{" "}
              <Link to="/login" className="auth-inline-link">
                {copy.registerPage.loginLink}
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

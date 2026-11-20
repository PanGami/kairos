import { useId, useState, type FormEvent } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { GoogleAuthButton } from "../components/auth/GoogleAuthButton";
import { PageSkeleton } from "../components/LoadingSkeleton";
import { OtpVerificationView } from "../components/auth/OtpVerificationView";
import { PasswordInput } from "../components/auth/PasswordInput";
import { useAuth } from "../hooks/useAuth";
import { useLocale } from "../hooks/useLocale";
import { ApiError } from "../services/api.client";

export function LoginPage() {
  const { user, loading, error, loginWithPassword, verifyOtp } = useAuth();
  const { t } = useLocale();
  const copy = t.authUi;
  const [searchParams] = useSearchParams();

  const emailId = useId();
  const passwordId = useId();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [googleOnlyHint, setGoogleOnlyHint] = useState(false);
  const [pendingOtp, setPendingOtp] = useState<{ email: string; cooldown: number } | null>(null);

  if (loading) {
    return <PageSkeleton variant="auth" label={t.login.checkingAuth} />;
  }
  if (user) {
    return <Navigate to="/" replace />;
  }

  const resetSuccess = searchParams.get("reset") === "success";

  async function handlePasswordLogin(event: FormEvent) {
    event.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setLoginError(copy.loginPage.invalidCredentials);
      return;
    }

    setSubmitting(true);
    setLoginError(null);
    setGoogleOnlyHint(false);

    try {
      await loginWithPassword(trimmedEmail, password);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.code === "EMAIL_NOT_VERIFIED") {
          setPendingOtp({
            email: err.email || trimmedEmail,
            cooldown: err.retryAfterSeconds ?? 60,
          });
          return;
        }
        if (err.code === "GOOGLE_ONLY_ACCOUNT") {
          setGoogleOnlyHint(true);
          setLoginError(copy.loginPage.googleOnlyMessage);
          return;
        }
        if (err.code === "INVALID_CREDENTIALS") {
          setLoginError(copy.loginPage.invalidCredentials);
          return;
        }
        if (err.code === "ACCOUNT_SUSPENDED") {
          setLoginError(copy.loginPage.suspendedError);
          return;
        }
      }
      setLoginError(err instanceof Error ? err.message : copy.loginPage.invalidCredentials);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        {pendingOtp ? (
          <OtpVerificationView
            email={pendingOtp.email}
            purpose="register_verify"
            title={copy.otp.titleVerifyLogin}
            initialCooldownSeconds={pendingOtp.cooldown}
            initialInfoBanner={copy.loginPage.unverifiedBanner}
            onVerify={(code) => verifyOtp(pendingOtp.email, "register_verify", code)}
            onBack={() => setPendingOtp(null)}
          />
        ) : (
          <>
            <div className="auth-card-head">
              <span className="pill pill-cyan">{copy.loginPage.badge}</span>
              <h1>{copy.loginPage.title}</h1>
              <p className="muted">{copy.loginPage.description}</p>
            </div>

            {resetSuccess && (
              <div className="banner banner-verified" role="status">
                {copy.loginPage.resetSuccessBanner}
              </div>
            )}

            {(error || loginError) && (
              <div className="banner banner-error" role="alert">
                <p className="banner-text">{loginError ?? error}</p>
                {googleOnlyHint && (
                  <div className="banner-actions">
                    <Link to="/forgot-password" className="btn btn-secondary">
                      {copy.loginPage.goToForgotFromGoogleOnly}
                    </Link>
                  </div>
                )}
              </div>
            )}

            <form className="auth-form" onSubmit={(e) => void handlePasswordLogin(e)} noValidate>
              <div className="form-field">
                <label htmlFor={emailId} className="form-label">
                  {copy.common.emailLabel}
                </label>
                <input
                  id={emailId}
                  type="email"
                  autoComplete="email"
                  className="form-input"
                  placeholder={copy.loginPage.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <div className="form-label-row">
                  <label htmlFor={passwordId} className="form-label">
                    {copy.common.passwordLabel}
                  </label>
                  <Link to="/forgot-password" className="auth-inline-link">
                    {copy.loginPage.forgotLink}
                  </Link>
                </div>
                <PasswordInput
                  id={passwordId}
                  autoComplete="current-password"
                  value={password}
                  onChange={setPassword}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
                {submitting ? copy.loginPage.submitting : copy.loginPage.submitButton}
              </button>
            </form>

            <div className="auth-divider" aria-hidden="true">
              <span>{copy.common.orDivider}</span>
            </div>

            <div className="login-actions">
              <GoogleAuthButton onError={setLoginError} disabled={submitting} />
              <Link to="/watcher" className="btn btn-ghost btn-full">
                {t.login.continueGuest}
              </Link>
            </div>

            <p className="auth-switch-note">
              <span>{copy.loginPage.registerPrompt}</span>{" "}
              <Link to="/register" className="auth-inline-link">
                {copy.loginPage.registerLink}
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useLocale } from "../hooks/useLocale";

interface GoogleAccountsID {
  initialize: (cfg: { client_id: string; callback: (res: { credential: string }) => void }) => void;
  renderButton: (el: HTMLElement, opts: Record<string, string>) => void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsID } };
  }
}

export function LoginPage() {
  const { user, config, loading, error, loginWithToken } = useAuth();
  const { t } = useLocale();
  const [submitting, setSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const btnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clientId = config?.google_client_id;
    if (!clientId || !btnRef.current) return;

    let cancelled = false;
    const renderGoogleButton = () => {
      if (cancelled || !btnRef.current || !window.google?.accounts?.id) return;
      btnRef.current.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          setSubmitting(true);
          setLoginError(null);
          try {
            await loginWithToken(credential);
          } catch (e: unknown) {
            setLoginError(e instanceof Error ? e.message : t.login.googleSignInFailed);
          } finally {
            setSubmitting(false);
          }
        },
      });
      window.google.accounts.id.renderButton(btnRef.current, {
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "rectangular",
      });
    };

    if (window.google?.accounts?.id) {
      renderGoogleButton();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = renderGoogleButton;
    script.onerror = () => {
      if (!cancelled) setLoginError(t.login.scriptLoadError);
    };
    document.head.appendChild(script);
    return () => {
      cancelled = true;
    };
  }, [config?.google_client_id, loginWithToken, t.login.googleSignInFailed, t.login.scriptLoadError]);

  if (loading) {
    return (
      <div className="login-shell">
        <p className="muted">{t.login.checkingAuth}</p>
      </div>
    );
  }
  if (user) {
    return <Navigate to="/" replace />;
  }

  async function handleDevSignIn() {
    setSubmitting(true);
    setLoginError(null);
    try {
      await loginWithToken("dev:analyst@kairos.local:KAIROS Analyst");
    } catch (e: unknown) {
      setLoginError(e instanceof Error ? e.message : t.login.signInFailed);
    } finally {
      setSubmitting(false);
    }
  }

  const hasGoogle = Boolean(config?.google_client_id);
  const hasDev = Boolean(config?.dev_login_enabled);

  return (
    <div className="login-shell">
      <div className="login-card">
        <h1>{t.login.title}</h1>
        <p className="muted">{t.login.description}</p>

        {(error || loginError) && (
          <div className="banner banner-error" role="alert">
            {loginError ?? error}
          </div>
        )}

        <div className="login-actions">
          {hasGoogle && <div ref={btnRef} />}
          {hasDev && (
            <button type="button" className="btn btn-primary" disabled={submitting} onClick={handleDevSignIn}>
              {submitting ? t.login.signingIn : t.login.devSignInButton}
            </button>
          )}
          {!hasGoogle && !hasDev && <div className="banner banner-info">{t.login.unavailableBanner}</div>}
          <Link to="/watcher" className="btn btn-ghost">
            {t.login.continueGuest}
          </Link>
        </div>
      </div>
    </div>
  );
}

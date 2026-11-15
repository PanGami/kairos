import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { Disclaimer } from "../components/Disclaimer";
import { useAuth } from "../hooks/useAuth";

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
            setLoginError(e instanceof Error ? e.message : "Google Sign-In failed");
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
      if (!cancelled) setLoginError("Failed to load Google Sign-In script.");
    };
    document.head.appendChild(script);
    return () => {
      cancelled = true;
    };
  }, [config?.google_client_id, loginWithToken]);

  if (loading) {
    return (
      <div className="login-shell">
        <p className="muted">Checking authentication…</p>
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
      setLoginError(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setSubmitting(false);
    }
  }

  const hasGoogle = Boolean(config?.google_client_id);
  const hasDev = Boolean(config?.dev_login_enabled);

  return (
    <div className="login-shell">
      <div className="login-card">
        <strong className="brand">KAIROS</strong>
        <h1>End-of-Day Risk Monitor</h1>
        <p className="muted">
          Sign in with your Google account to access calibrated volatility intervals and drawdown probabilities.
        </p>

        {(error || loginError) && <div className="banner banner-error">{loginError ?? error}</div>}

        <div className="login-actions">
          {hasGoogle && <div ref={btnRef} />}
          {hasDev && (
            <button type="button" className="btn-primary" disabled={submitting} onClick={handleDevSignIn}>
              {submitting ? "Signing in…" : "Sign in with Google (Dev Sandbox)"}
            </button>
          )}
          {!hasGoogle && !hasDev && (
            <div className="banner banner-info">
              Google Sign-In is not configured yet. Set <code>GOOGLE_CLIENT_ID</code> in <code>.env</code> and restart
              the stack.
            </div>
          )}
        </div>

        <Disclaimer />
      </div>
    </div>
  );
}

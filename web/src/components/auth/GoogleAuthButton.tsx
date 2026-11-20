import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useLocale } from "../../hooks/useLocale";
import { useTheme } from "../../hooks/useTheme";
import * as authService from "../../services/auth.service";

interface GoogleAccountsID {
  initialize: (cfg: { client_id: string; callback: (res: { credential: string }) => void }) => void;
  renderButton: (el: HTMLElement, opts: Record<string, string | number>) => void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsID } };
  }
}

interface GoogleAuthButtonProps {
  onError: (msg: string | null) => void;
  onCredential?: (idToken: string, state: string) => Promise<void>;
  buttonSize?: "large" | "medium";
  devToken?: string;
  devButtonLabel?: string;
  hideUnavailableBanner?: boolean;
  disabled?: boolean;
}

export function GoogleAuthButton({
  onError,
  onCredential,
  buttonSize = "large",
  devToken = "dev:analyst@kairos.local:KAIROS Analyst",
  devButtonLabel,
  hideUnavailableBanner = false,
  disabled = false,
}: GoogleAuthButtonProps) {
  const { config, loginWithToken } = useAuth();
  const { t } = useLocale();
  const [theme] = useTheme();
  const [submitting, setSubmitting] = useState(false);
  const btnRef = useRef<HTMLDivElement>(null);

  const handleToken = onCredential ?? loginWithToken;

  useEffect(() => {
    const clientId = config?.google_client_id;
    if (!clientId || !btnRef.current) return;

    let cancelled = false;
    const renderGoogleButton = () => {
      if (cancelled || !btnRef.current || !window.google?.accounts?.id) return;
      const containerWidth = btnRef.current.clientWidth;
      const targetWidth =
        buttonSize === "medium"
          ? Math.min(Math.max(containerWidth || 240, 200), 280)
          : Math.min(Math.max(containerWidth || 360, 240), 400);

      btnRef.current.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          setSubmitting(true);
          onError(null);
          try {
            const state = await authService.getGoogleState();
            await handleToken(credential, state);
          } catch (e: unknown) {
            onError(e instanceof Error ? e.message : t.login.googleSignInFailed);
          } finally {
            setSubmitting(false);
          }
        },
      });
      window.google.accounts.id.renderButton(btnRef.current, {
        theme: theme === "light" ? "outline" : "filled_black",
        size: buttonSize,
        text: "signin_with",
        shape: "rectangular",
        width: targetWidth,
        logo_alignment: "center",
      });
    };

    if (window.google?.accounts?.id) {
      renderGoogleButton();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener("load", renderGoogleButton);
      return () => {
        cancelled = true;
        existing.removeEventListener("load", renderGoogleButton);
      };
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = renderGoogleButton;
    script.onerror = () => {
      if (!cancelled) onError(t.login.scriptLoadError);
    };
    document.head.appendChild(script);
    return () => {
      cancelled = true;
    };
  }, [
    buttonSize,
    config?.google_client_id,
    handleToken,
    onError,
    theme,
    t.login.googleSignInFailed,
    t.login.scriptLoadError,
  ]);

  async function handleDevSignIn() {
    setSubmitting(true);
    onError(null);
    try {
      const state = await authService.getGoogleState();
      await handleToken(devToken, state);
    } catch (e: unknown) {
      onError(e instanceof Error ? e.message : t.login.signInFailed);
    } finally {
      setSubmitting(false);
    }
  }

  const hasGoogle = Boolean(config?.google_client_id);
  const hasDev = Boolean(config?.dev_login_enabled);

  return (
    <div className="google-auth-group">
      {hasGoogle && <div ref={btnRef} className={buttonSize === "medium" ? "google-gsi-slot-compact" : "google-gsi-slot"} />}
      {hasDev && (
        <button
          type="button"
          className="btn btn-secondary btn-full"
          disabled={disabled || submitting}
          onClick={() => void handleDevSignIn()}
        >
          {submitting ? t.login.signingIn : (devButtonLabel ?? t.login.devSignInButton)}
        </button>
      )}
      {!hasGoogle && !hasDev && !hideUnavailableBanner && (
        <div className="banner banner-info">{t.login.unavailableBanner}</div>
      )}
    </div>
  );
}

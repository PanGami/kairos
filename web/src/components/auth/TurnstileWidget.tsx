import { useEffect, useRef } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useLocale } from "../../hooks/useLocale";
import { useTheme } from "../../hooks/useTheme";

interface TurnstileApi {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      theme?: "light" | "dark" | "auto";
      size?: "normal" | "compact" | "flexible";
      callback: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
    },
  ) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const TURNSTILE_SCRIPT_ID = "kairos-turnstile-script";
const TURNSTILE_SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Turnstile script error")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = TURNSTILE_SCRIPT_ID;
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Turnstile script error"));
    document.head.appendChild(script);
  });
}

interface TurnstileWidgetProps {
  resetKey: number;
  onTokenChange: (token: string | null) => void;
  onError?: (message: string) => void;
}

export function TurnstileWidget({ resetKey, onTokenChange, onError }: TurnstileWidgetProps) {
  const { config } = useAuth();
  const [theme] = useTheme();
  const { t } = useLocale();
  const siteKey = config?.turnstile_site_key?.trim() ?? "";

  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onTokenChange);
  const onErrorRef = useRef(onError);
  onTokenRef.current = onTokenChange;
  onErrorRef.current = onError;

  useEffect(() => {
    if (!siteKey) {
      onTokenRef.current(null);
      return;
    }

    let cancelled = false;
    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        if (widgetIdRef.current) {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        }
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: theme === "light" ? "light" : "dark",
          size: "flexible",
          callback: (token) => onTokenRef.current(token),
          "expired-callback": () => onTokenRef.current(null),
          "error-callback": () => {
            onTokenRef.current(null);
            onErrorRef.current?.(t.authUi.common.captchaLoadError);
          },
        });
      })
      .catch(() => {
        if (!cancelled) {
          onErrorRef.current?.(t.authUi.common.captchaLoadError);
        }
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, theme, t.authUi.common.captchaLoadError]);

  useEffect(() => {
    if (resetKey > 0 && widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
      onTokenRef.current(null);
    }
  }, [resetKey]);

  if (!siteKey) return null;

  return <div ref={containerRef} className="turnstile-wrap" />;
}

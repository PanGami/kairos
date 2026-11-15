import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { ApiError } from "../services/api.client";
import * as authService from "../services/auth.service";
import type { AuthConfig, User } from "../types/api.types";

interface AuthContextValue {
  user: User | null;
  config: AuthConfig | null;
  loading: boolean;
  error: string | null;
  loginWithToken: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [config, setConfig] = useState<AuthConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    async function bootstrap() {
      try {
        const cfg = await authService.getAuthConfig(ctrl.signal);
        if (ctrl.signal.aborted) return;
        setConfig(cfg);
      } catch (e: unknown) {
        if (!ctrl.signal.aborted) {
          setError(e instanceof Error ? e.message : "Failed to load auth configuration");
        }
      }

      try {
        const me = await authService.getMe(ctrl.signal);
        if (!ctrl.signal.aborted) {
          setUser(me);
        }
      } catch (e: unknown) {
        if (ctrl.signal.aborted) return;
        if (e instanceof ApiError && e.status === 401) {
          authService.clearSessionToken();
        }
        setUser(null);
      } finally {
        if (!ctrl.signal.aborted) {
          setLoading(false);
        }
      }
    }
    void bootstrap();
    return () => ctrl.abort();
  }, []);

  const loginWithToken = useCallback(async (idToken: string) => {
    setError(null);
    const res = await authService.signInWithGoogle(idToken);
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    setError(null);
    await authService.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, config, loading, error, loginWithToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}

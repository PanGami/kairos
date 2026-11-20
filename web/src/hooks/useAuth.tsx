import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { ApiError } from "../services/api.client";
import * as authService from "../services/auth.service";
import type { AuthConfig, OTPPurpose, User } from "../types/api.types";

interface AuthContextValue {
  user: User | null;
  config: AuthConfig | null;
  loading: boolean;
  error: string | null;
  loginWithToken: (idToken: string, state?: string) => Promise<void>;
  linkGoogleWithToken: (idToken: string, state?: string) => Promise<User>;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  verifyOtp: (email: string, purpose: OTPPurpose, code: string) => Promise<void>;
  updateProfile: (name: string, avatarKey: string) => Promise<User>;
  setUserState: (next: User | null) => void;
  clearLocalSession: () => void;
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

  const loginWithToken = useCallback(async (idToken: string, state?: string) => {
    setError(null);
    const res = await authService.signInWithGoogle(idToken, state);
    setUser(res.user);
  }, []);

  const linkGoogleWithToken = useCallback(async (idToken: string, state?: string): Promise<User> => {
    const next = await authService.linkGoogle(idToken, state);
    setUser(next);
    return next;
  }, []);

  const loginWithPassword = useCallback(async (email: string, password: string) => {
    setError(null);
    const res = await authService.loginWithPassword({ email, password });
    setUser(res.user);
  }, []);

  const verifyOtp = useCallback(async (email: string, purpose: OTPPurpose, code: string) => {
    setError(null);
    const res = await authService.verifyOtp({ email, purpose, code });
    setUser(res.user);
  }, []);

  const updateProfile = useCallback(async (name: string, avatarKey: string): Promise<User> => {
    const next = await authService.updateProfile({ name, avatar_key: avatarKey });
    setUser(next);
    return next;
  }, []);

  const clearLocalSession = useCallback(() => {
    authService.clearSessionToken();
    setUser(null);
  }, []);

  const logout = useCallback(async () => {
    setError(null);
    await authService.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        config,
        loading,
        error,
        loginWithToken,
        linkGoogleWithToken,
        loginWithPassword,
        verifyOtp,
        updateProfile,
        setUserState: setUser,
        clearLocalSession,
        logout,
      }}
    >
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

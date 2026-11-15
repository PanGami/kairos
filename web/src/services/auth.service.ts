import type { AuthConfig, SignInResponse, User } from "../types/api.types";
import { getJson, getStoredToken, postJson, SESSION_STORAGE_KEY } from "./api.client";

export function getSessionToken(): string | null {
  return getStoredToken();
}

export function setSessionToken(token: string): void {
  localStorage.setItem(SESSION_STORAGE_KEY, token);
}

export function clearSessionToken(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function getAuthConfig(signal?: AbortSignal): Promise<AuthConfig> {
  return getJson<AuthConfig>("/v1/auth/config", signal);
}

export async function signInWithGoogle(idToken: string, signal?: AbortSignal): Promise<SignInResponse> {
  const res = await postJson<SignInResponse>("/v1/auth/google", { id_token: idToken }, signal);
  setSessionToken(res.session_token);
  return res;
}

export async function getMe(signal?: AbortSignal): Promise<User> {
  const res = await getJson<{ user: User }>("/v1/auth/me", signal);
  return res.user;
}

export async function logout(signal?: AbortSignal): Promise<void> {
  try {
    await postJson<{ ok: boolean }>("/v1/auth/logout", {}, signal);
  } finally {
    clearSessionToken();
  }
}

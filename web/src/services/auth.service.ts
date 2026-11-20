import type {
  AuthConfig,
  ForgotPasswordResponse,
  OTPPurpose,
  OtpSentResponse,
  RegisterResponse,
  SignInResponse,
  User,
} from "../types/api.types";
import { getJson, getStoredToken, patchJson, postJson, SESSION_STORAGE_KEY } from "./api.client";

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

export async function getGoogleState(signal?: AbortSignal): Promise<string> {
  const res = await getJson<{ state: string }>("/v1/auth/google/state", signal);
  return res.state;
}

export async function signInWithGoogle(
  idToken: string,
  state?: string,
  signal?: AbortSignal,
): Promise<SignInResponse> {
  const res = await postJson<SignInResponse>("/v1/auth/google", { id_token: idToken, state }, signal);
  setSessionToken(res.session_token);
  return res;
}

export async function linkGoogle(
  idToken: string,
  state?: string,
  signal?: AbortSignal,
): Promise<User> {
  const res = await postJson<{ user: User }>("/v1/auth/google/link", { id_token: idToken, state }, signal);
  return res.user;
}

export function registerAccount(
  payload: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    captcha_token?: string;
  },
  signal?: AbortSignal,
): Promise<RegisterResponse> {
  return postJson<RegisterResponse>("/v1/auth/register", payload, signal);
}

export async function verifyOtp(
  payload: { email: string; purpose: OTPPurpose; code: string },
  signal?: AbortSignal,
): Promise<SignInResponse> {
  const res = await postJson<SignInResponse>("/v1/auth/otp/verify", payload, signal);
  setSessionToken(res.session_token);
  return res;
}

export function resendOtp(
  payload: { email: string; purpose: OTPPurpose },
  signal?: AbortSignal,
): Promise<OtpSentResponse> {
  return postJson<OtpSentResponse>("/v1/auth/otp/resend", payload, signal);
}

export async function loginWithPassword(
  payload: { email: string; password: string },
  signal?: AbortSignal,
): Promise<SignInResponse> {
  const res = await postJson<SignInResponse>("/v1/auth/login", payload, signal);
  setSessionToken(res.session_token);
  return res;
}

export function forgotPassword(
  email: string,
  captchaToken?: string,
  signal?: AbortSignal,
): Promise<ForgotPasswordResponse> {
  return postJson<ForgotPasswordResponse>(
    "/v1/auth/password/forgot",
    captchaToken ? { email, captcha_token: captchaToken } : { email },
    signal,
  );
}

export async function resetPassword(
  payload: { email: string; code: string; new_password: string; password_confirmation: string },
  signal?: AbortSignal,
): Promise<void> {
  await postJson<{ ok: boolean }>("/v1/auth/password/reset", payload, signal);
  clearSessionToken();
}

export async function getMe(signal?: AbortSignal): Promise<User> {
  const res = await getJson<{ user: User }>("/v1/auth/me", signal);
  return res.user;
}

export async function updateProfile(
  payload: { name: string; avatar_key: string },
  signal?: AbortSignal,
): Promise<User> {
  const res = await patchJson<{ user: User }>("/v1/auth/profile", payload, signal);
  return res.user;
}

export async function changePassword(
  payload: { current_password: string; new_password: string; password_confirmation: string },
  signal?: AbortSignal,
): Promise<void> {
  await postJson<{ ok: boolean }>("/v1/auth/password/change", payload, signal);
}

export function requestSetPasswordOtp(signal?: AbortSignal): Promise<RegisterResponse> {
  return postJson<RegisterResponse>("/v1/auth/password/set/request-otp", {}, signal);
}

export async function setInitialPassword(
  payload: { code: string; new_password: string; password_confirmation: string },
  signal?: AbortSignal,
): Promise<User> {
  const res = await postJson<{ user: User }>("/v1/auth/password/set", payload, signal);
  return res.user;
}

export async function logout(signal?: AbortSignal): Promise<void> {
  try {
    await postJson<{ ok: boolean }>("/v1/auth/logout", {}, signal);
  } finally {
    clearSessionToken();
  }
}

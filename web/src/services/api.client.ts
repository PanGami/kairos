const API_BASE = import.meta.env.VITE_API_BASE ?? "";
export const SESSION_STORAGE_KEY = "kairos-session-token";

interface ErrorPayload {
  error?: string;
  code?: string;
  email?: string;
  retry_after_seconds?: number;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  email?: string;
  retryAfterSeconds?: number;

  constructor(status: number, message: string, meta?: ErrorPayload) {
    super(message);
    this.status = status;
    this.code = meta?.code;
    this.email = meta?.email;
    this.retryAfterSeconds = meta?.retry_after_seconds;
  }
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
}

function buildHeaders(extra?: Record<string, string>): HeadersInit {
  const headers: Record<string, string> = { ...extra };
  const token = getStoredToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let payload: ErrorPayload | undefined;
    const rawText = await res.text();
    if (rawText) {
      try {
        payload = JSON.parse(rawText) as ErrorPayload;
      } catch {
        payload = undefined;
      }
    }
    const fallback =
      res.status === 401
        ? "Unauthorized"
        : res.status === 404
          ? "Not found"
          : rawText && !payload
            ? rawText.trim()
            : `Request failed (${res.status})`;
    throw new ApiError(res.status, payload?.error || fallback, payload);
  }
  return (await res.json()) as T;
}

export async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers: buildHeaders(),
    credentials: "include",
    signal,
  });
  return handleResponse<T>(res);
}

export async function postJson<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: buildHeaders({ "Content-Type": "application/json" }),
    credentials: "include",
    body: JSON.stringify(body),
    signal,
  });
  return handleResponse<T>(res);
}

export async function patchJson<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PATCH",
    headers: buildHeaders({ "Content-Type": "application/json" }),
    credentials: "include",
    body: JSON.stringify(body),
    signal,
  });
  return handleResponse<T>(res);
}

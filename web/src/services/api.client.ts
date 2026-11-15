const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { signal });
  if (!res.ok) {
    throw new Error(res.status === 404 ? "Not found" : `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

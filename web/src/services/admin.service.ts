import type { AdminRefreshItem, User } from "../types/api.types";
import { deleteJson, getJson, postJson } from "./api.client";

export async function listUsers(search = "", signal?: AbortSignal): Promise<User[]> {
  const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
  const data = await getJson<{ users: User[] }>(`/v1/admin/users${query}`, signal);
  return data.users ?? [];
}

export async function setUserSuspended(userId: string, suspended: boolean): Promise<User> {
  const data = await postJson<{ user: User }>(`/v1/admin/users/${encodeURIComponent(userId)}/suspend`, {
    suspended,
  });
  return data.user;
}

export async function revokeUserSessions(userId: string): Promise<number> {
  const data = await postJson<{ revoked_count: number }>(
    `/v1/admin/users/${encodeURIComponent(userId)}/revoke-sessions`,
    {}
  );
  return data.revoked_count ?? 0;
}

export async function deleteUser(userId: string): Promise<void> {
  await deleteJson<{ ok: boolean }>(`/v1/admin/users/${encodeURIComponent(userId)}`);
}

export async function triggerWatcherRefresh(): Promise<AdminRefreshItem[]> {
  const data = await postJson<{ refreshed: AdminRefreshItem[] }>("/v1/admin/refresh", {});
  return data.refreshed ?? [];
}

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { UserTableSkeleton } from "../components/LoadingSkeleton";
import { DeleteUserModal } from "../components/admin/DeleteUserModal";
import { useAuth } from "../hooks/useAuth";
import { useLocale } from "../hooks/useLocale";
import type { AdminUserFilter } from "../i18n/admin.messages";
import {
  deleteUser,
  listUsers,
  revokeUserSessions,
  setUserSuspended,
  triggerWatcherRefresh,
} from "../services/admin.service";
import type { AdminRefreshItem, User } from "../types/api.types";
import { resolveAvatarSrc } from "../utils/passwordPolicy";

function formatLoginDate(raw: string | undefined, locale: "en" | "id", fallback: string): string {
  if (!raw) return fallback;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function authMethodLabel(user: User, copy: { authGoogle: string; authPassword: string; authGoogleAndPassword: string }): string {
  if (user.google_linked && user.has_password) return copy.authGoogleAndPassword;
  if (user.google_linked) return copy.authGoogle;
  return copy.authPassword;
}

function refreshStatusPillClass(status: string): string {
  const norm = status.toLowerCase();
  if (norm === "ok") return "pill pill-verified";
  if (norm === "degraded") return "pill pill-warning";
  return "pill pill-danger";
}

const PAGE_SIZE_OPTIONS = [5, 10, 20] as const;

export function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const { locale, t } = useLocale();
  const copy = t.adminUsers;
  const searchInputId = useId();
  const pageSizeId = useId();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [filter, setFilter] = useState<AdminUserFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0]);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [refreshing, setRefreshing] = useState(false);
  const [refreshResults, setRefreshResults] = useState<AdminRefreshItem[] | null>(null);

  const loadDirectory = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const list = await listUsers("", signal);
      setUsers(list);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setErrorMessage(err instanceof Error ? err.message : copy.loadingUsers);
    } finally {
      setLoading(false);
    }
  }, [copy.loadingUsers]);

  useEffect(() => {
    const controller = new AbortController();
    void loadDirectory(controller.signal);
    return () => controller.abort();
  }, [loadDirectory]);

  const counts = useMemo(() => {
    let admins = 0;
    let suspended = 0;
    for (const u of users) {
      if (u.role === "admin") admins += 1;
      if (u.suspended) suspended += 1;
    }
    return { total: users.length, admins, suspended };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const term = searchInput.trim().toLowerCase();
    return users.filter((u) => {
      if (
        term &&
        !u.name.toLowerCase().includes(term) &&
        !u.email.toLowerCase().includes(term)
      ) {
        return false;
      }
      if (filter === "admin") return u.role === "admin";
      if (filter === "user") return u.role !== "admin";
      if (filter === "active") return !u.suspended;
      if (filter === "suspended") return u.suspended;
      return true;
    });
  }, [users, searchInput, filter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchInput, filter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + pageSize);
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  async function handleRefreshWatcher() {
    setRefreshing(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const results = await triggerWatcherRefresh();
      setRefreshResults(results);
      setStatusMessage(copy.refreshSuccess(results.length));
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to refresh watcher data");
    } finally {
      setRefreshing(false);
    }
  }

  async function handleToggleSuspend(target: User) {
    setBusyUserId(target.user_id);
    setStatusMessage(null);
    setErrorMessage(null);
    const nextSuspended = !target.suspended;
    try {
      const updated = await setUserSuspended(target.user_id, nextSuspended);
      setUsers((prev) =>
        prev.map((row) =>
          row.user_id === target.user_id
            ? {
                ...row,
                ...updated,
                active_sessions: nextSuspended ? 0 : row.active_sessions,
              }
            : row
        )
      );
      setStatusMessage(nextSuspended ? copy.suspendSuccess(target.email) : copy.activateSuccess(target.email));
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to update user status");
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleForceLogout(target: User) {
    setBusyUserId(target.user_id);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const revoked = await revokeUserSessions(target.user_id);
      setUsers((prev) =>
        prev.map((row) => (row.user_id === target.user_id ? { ...row, active_sessions: 0 } : row))
      );
      setStatusMessage(copy.revokeSuccess(target.email, revoked));
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to revoke sessions");
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleConfirmDelete(target: User) {
    setBusyUserId(target.user_id);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      await deleteUser(target.user_id);
      setUsers((prev) => prev.filter((row) => row.user_id !== target.user_id));
      setDeleteTarget(null);
      setStatusMessage(copy.deleteSuccess(target.email));
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setBusyUserId(null);
    }
  }

  const filterOptions: Array<{ key: AdminUserFilter; label: string }> = [
    { key: "all", label: copy.filterAll },
    { key: "admin", label: copy.filterAdmin },
    { key: "user", label: copy.filterUser },
    { key: "active", label: copy.filterActive },
    { key: "suspended", label: copy.filterSuspended },
  ];

  return (
    <div className="profile-screen admin-screen">
      <header className="admin-top-bar">
        <div className="admin-top-copy">
          <h1 className="profile-title">{copy.pageTitle}</h1>
          <p className="profile-lead">{copy.pageSubtitle}</p>
        </div>
        <button
          type="button"
          className="btn btn-primary admin-watcher-btn"
          disabled={refreshing}
          onClick={() => void handleRefreshWatcher()}
        >
          {refreshing ? copy.refreshingButton : copy.refreshButton}
        </button>
      </header>

      {statusMessage && (
        <div className="banner banner-verified" role="status">
          {statusMessage}
        </div>
      )}

      {errorMessage && (
        <div className="banner banner-error" role="alert">
          {errorMessage}
        </div>
      )}

      {refreshResults && refreshResults.length > 0 && (
        <section className="terminal-widget" aria-label={copy.refreshWidgetTitle}>
          <div className="widget-header">
            <span className="widget-title">{copy.refreshWidgetTitle}</span>
          </div>
          <div className="admin-widget-body">
            <div className="admin-refresh-list">
              {refreshResults.map((item) => (
                <div key={item.instrument_id} className="admin-refresh-item">
                  <div className="admin-refresh-head">
                    <span className="mono">{item.instrument_id}</span>
                    <span className={refreshStatusPillClass(item.status)}>
                      {item.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="muted admin-refresh-msg">{item.message || item.run_id}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="terminal-widget" aria-label={copy.directoryWidgetTitle}>
        <div className="widget-header admin-directory-header">
          <span className="widget-title">{copy.directoryWidgetTitle}</span>
          <div className="admin-kpi-strip">
            <span className="admin-kpi-inline">
              <span className="admin-kpi-label">{copy.statTotalUsers}</span>
              <span className="mono admin-kpi-val">{counts.total}</span>
            </span>
            <span className="admin-kpi-inline">
              <span className="admin-kpi-label">{copy.statAdmins}</span>
              <span className="mono admin-kpi-val">{counts.admins}</span>
            </span>
            <span className="admin-kpi-inline">
              <span className="admin-kpi-label">{copy.statSuspended}</span>
              <span className="mono admin-kpi-val">{counts.suspended}</span>
            </span>
          </div>
        </div>

        <div className="admin-widget-body">
          <div className="admin-toolbar">
            <div className="admin-search-form">
              <label htmlFor={searchInputId} className="sr-only">
                {copy.searchLabel}
              </label>
              <input
                id={searchInputId}
                type="search"
                className="form-input admin-search-input"
                placeholder={copy.searchPlaceholder}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              {searchInput.trim() !== "" && (
                <button
                  type="button"
                  className="btn btn-ghost admin-clear-btn"
                  onClick={() => setSearchInput("")}
                >
                  {copy.clearSearch}
                </button>
              )}
            </div>

            <div className="admin-filter-group" role="group" aria-label={copy.directoryWidgetTitle}>
              {filterOptions.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  className={`admin-filter-pill${filter === opt.key ? " is-active" : ""}`}
                  aria-pressed={filter === opt.key}
                  onClick={() => setFilter(opt.key)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <UserTableSkeleton rows={pageSize} label={copy.loadingUsers} />
          ) : filteredUsers.length === 0 ? (
            <div className="admin-empty-box">{copy.emptyUsers}</div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{copy.colIdentity}</th>
                    <th>{copy.colRole} / {copy.colStatus}</th>
                    <th>{copy.colAuth}</th>
                    <th>{copy.colLastLogin}</th>
                    <th className="admin-col-actions">{copy.colActions}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((row) => {
                    const isSelf = currentUser?.user_id === row.user_id;
                    const isBusy = busyUserId === row.user_id;
                    const avatarSrc = resolveAvatarSrc(row.avatar_key, row.picture_url);
                    return (
                      <tr key={row.user_id}>
                        <td data-label={copy.colIdentity}>
                          <div className="admin-user-cell">
                            <img
                              src={avatarSrc}
                              alt={row.name}
                              width={32}
                              height={32}
                              loading="lazy"
                              decoding="async"
                              className="admin-user-avatar"
                            />
                            <div className="admin-user-meta">
                              <span className="admin-user-name" title={row.name}>
                                {row.name}
                              </span>
                              <span className="mono admin-user-email" title={row.email}>
                                {row.email}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td data-label={`${copy.colRole} / ${copy.colStatus}`}>
                          <div className="admin-pill-pair">
                            <span className={`pill ${row.role === "admin" ? "pill-cyan" : "pill-muted"}`}>
                              {row.role === "admin" ? copy.roleAdmin : copy.roleUser}
                            </span>
                            <span className={`pill ${row.suspended ? "pill-danger" : "pill-verified"}`}>
                              {row.suspended ? copy.statusSuspended : copy.statusActive}
                            </span>
                          </div>
                        </td>
                        <td data-label={copy.colAuth}>
                          <div className="admin-meta-stack">
                            <span className="mono admin-auth-tag">{authMethodLabel(row, copy)}</span>
                            <span className="mono admin-session-sub">
                              {row.active_sessions ?? 0} {copy.colSessions.toLowerCase()}
                            </span>
                          </div>
                        </td>
                        <td data-label={copy.colLastLogin}>
                          <span className="mono admin-date-cell">
                            {formatLoginDate(row.last_login_at, locale, copy.neverLoggedIn)}
                          </span>
                        </td>
                        <td data-label={copy.colActions} className="admin-actions-cell">
                          {isSelf ? (
                            <span className="pill pill-cyan">{copy.currentSessionTag}</span>
                          ) : (
                            <div className="admin-row-actions">
                              <button
                                type="button"
                                className="btn btn-ghost admin-action-btn"
                                disabled={isBusy}
                                onClick={() => void handleForceLogout(row)}
                              >
                                {copy.actionForceLogout}
                              </button>
                              <button
                                type="button"
                                className={`btn admin-action-btn ${
                                  row.suspended ? "btn-secondary" : "btn-warning-outline"
                                }`}
                                disabled={isBusy}
                                onClick={() => void handleToggleSuspend(row)}
                              >
                                {row.suspended ? copy.actionActivate : copy.actionSuspend}
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger-outline admin-action-btn"
                                disabled={isBusy}
                                onClick={() => setDeleteTarget(row)}
                              >
                                {copy.actionDelete}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filteredUsers.length > 0 && (
            <div className="admin-pagination">
              <div className="admin-pagination-info">
                <span className="mono admin-pagination-summary">
                  {copy.paginationSummary(startIndex + 1, startIndex + paginatedUsers.length, filteredUsers.length)}
                </span>
                <div className="admin-page-size-group">
                  <label htmlFor={pageSizeId} className="admin-page-size-label">
                    {copy.rowsPerPageLabel}
                  </label>
                  <select
                    id={pageSizeId}
                    className="form-input admin-page-size-select mono"
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                  >
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <nav className="admin-pagination-controls" aria-label={copy.directoryWidgetTitle}>
                <button
                  type="button"
                  className="admin-page-btn"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage(safePage - 1)}
                >
                  {copy.prevPage}
                </button>
                {pageNumbers.map((page) => (
                  <button
                    key={page}
                    type="button"
                    className={`admin-page-btn mono${safePage === page ? " is-active" : ""}`}
                    aria-label={copy.pageAriaLabel(page)}
                    aria-current={safePage === page ? "page" : undefined}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  className="admin-page-btn"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage(safePage + 1)}
                >
                  {copy.nextPage}
                </button>
              </nav>
            </div>
          )}
        </div>
      </section>

      <DeleteUserModal
        open={Boolean(deleteTarget)}
        target={deleteTarget}
        busy={Boolean(deleteTarget && busyUserId === deleteTarget.user_id)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

export type PageSkeletonVariant = "dashboard" | "watcher" | "auth" | "profile" | "table";

export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`skeleton-block ${className}`.trim()} aria-hidden="true" />;
}

export function UserTableSkeleton({ rows = 5, label }: { rows?: number; label?: string }) {
  const count = Math.max(1, Math.min(rows, 10));
  return (
    <div
      className="skeleton-table"
      role="status"
      aria-busy="true"
      aria-label={label ?? "Loading user directory"}
    >
      {label && <span className="sr-only">{label}</span>}
      {Array.from({ length: count }, (_, idx) => (
        <div key={idx} className="skeleton-table-row" aria-hidden="true">
          <div className="skeleton-user-cell">
            <SkeletonBlock className="skeleton-circle" />
            <div className="skeleton-text-stack">
              <SkeletonBlock className="skeleton-line skeleton-w-140" />
              <SkeletonBlock className="skeleton-line-sm skeleton-w-180" />
            </div>
          </div>
          <div className="skeleton-pill-pair">
            <SkeletonBlock className="skeleton-pill" />
            <SkeletonBlock className="skeleton-pill" />
          </div>
          <div className="skeleton-text-stack">
            <SkeletonBlock className="skeleton-line-sm skeleton-w-96" />
            <SkeletonBlock className="skeleton-line-sm skeleton-w-64" />
          </div>
          <SkeletonBlock className="skeleton-line-sm skeleton-w-120" />
          <div className="skeleton-actions-pair">
            <SkeletonBlock className="skeleton-btn" />
            <SkeletonBlock className="skeleton-btn" />
            <SkeletonBlock className="skeleton-btn" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton({
  variant = "dashboard",
  label = "Loading page",
}: {
  variant?: PageSkeletonVariant;
  label?: string;
}) {
  if (variant === "auth") {
    return (
      <div className="login-shell" role="status" aria-busy="true" aria-label={label}>
        <span className="sr-only">{label}</span>
        <div className="login-card skeleton-stack" aria-hidden="true">
          <SkeletonBlock className="skeleton-pill" />
          <SkeletonBlock className="skeleton-title skeleton-w-220" />
          <SkeletonBlock className="skeleton-line skeleton-w-full" />
          <SkeletonBlock className="skeleton-input" />
          <SkeletonBlock className="skeleton-input" />
          <SkeletonBlock className="skeleton-btn-lg" />
        </div>
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className="profile-screen admin-screen" role="status" aria-busy="true" aria-label={label}>
        <span className="sr-only">{label}</span>
        <div className="admin-top-bar" aria-hidden="true">
          <div className="admin-top-copy">
            <SkeletonBlock className="skeleton-title skeleton-w-260" />
            <SkeletonBlock className="skeleton-line skeleton-w-320" />
          </div>
          <SkeletonBlock className="skeleton-btn-lg skeleton-w-160" />
        </div>
        <div className="terminal-widget" aria-hidden="true">
          <div className="widget-header">
            <SkeletonBlock className="skeleton-line skeleton-w-140" />
            <SkeletonBlock className="skeleton-line-sm skeleton-w-180" />
          </div>
          <div className="admin-widget-body">
            <UserTableSkeleton rows={5} />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "profile") {
    return (
      <div className="profile-screen" role="status" aria-busy="true" aria-label={label}>
        <span className="sr-only">{label}</span>
        <div className="profile-header" aria-hidden="true">
          <SkeletonBlock className="skeleton-pill" />
          <SkeletonBlock className="skeleton-title skeleton-w-220" />
          <SkeletonBlock className="skeleton-line skeleton-w-320" />
        </div>
        <div className="profile-grid" aria-hidden="true">
          <div className="terminal-widget skeleton-card-pad">
            <SkeletonBlock className="skeleton-line skeleton-w-140" />
            <div className="skeleton-user-cell">
              <SkeletonBlock className="skeleton-circle-lg" />
              <div className="skeleton-text-stack">
                <SkeletonBlock className="skeleton-line skeleton-w-160" />
                <SkeletonBlock className="skeleton-line-sm skeleton-w-200" />
              </div>
            </div>
            <SkeletonBlock className="skeleton-line skeleton-w-full" />
            <SkeletonBlock className="skeleton-line skeleton-w-full" />
          </div>
          <div className="terminal-widget skeleton-card-pad">
            <SkeletonBlock className="skeleton-line skeleton-w-140" />
            <SkeletonBlock className="skeleton-input" />
            <SkeletonBlock className="skeleton-input" />
            <SkeletonBlock className="skeleton-btn-lg skeleton-w-140" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "watcher") {
    return (
      <div className="skeleton-stack" role="status" aria-busy="true" aria-label={label}>
        <span className="sr-only">{label}</span>
        <div className="terminal-widget skeleton-card-pad" aria-hidden="true">
          <div className="skeleton-pill-pair">
            <SkeletonBlock className="skeleton-pill" />
            <SkeletonBlock className="skeleton-pill" />
            <SkeletonBlock className="skeleton-pill" />
            <SkeletonBlock className="skeleton-pill" />
          </div>
          <SkeletonBlock className="skeleton-chart" />
        </div>
      </div>
    );
  }

  return (
    <div className="skeleton-stack" role="status" aria-busy="true" aria-label={label}>
      <span className="sr-only">{label}</span>
      <div className="terminal-widget skeleton-card-pad" aria-hidden="true">
        <SkeletonBlock className="skeleton-pill" />
        <SkeletonBlock className="skeleton-title skeleton-w-260" />
        <SkeletonBlock className="skeleton-line skeleton-w-320" />
      </div>
      <div className="skeleton-grid-3" aria-hidden="true">
        <div className="terminal-widget skeleton-card-pad">
          <SkeletonBlock className="skeleton-line skeleton-w-140" />
          <SkeletonBlock className="skeleton-line-sm skeleton-w-full" />
          <SkeletonBlock className="skeleton-line-sm skeleton-w-180" />
        </div>
        <div className="terminal-widget skeleton-card-pad">
          <SkeletonBlock className="skeleton-line skeleton-w-140" />
          <SkeletonBlock className="skeleton-line-sm skeleton-w-full" />
          <SkeletonBlock className="skeleton-line-sm skeleton-w-180" />
        </div>
        <div className="terminal-widget skeleton-card-pad">
          <SkeletonBlock className="skeleton-line skeleton-w-140" />
          <SkeletonBlock className="skeleton-line-sm skeleton-w-full" />
          <SkeletonBlock className="skeleton-line-sm skeleton-w-180" />
        </div>
      </div>
    </div>
  );
}

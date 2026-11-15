import type { ReliabilityTier, RunStatus } from "../types/api.types";

const TIER_PILL: Record<ReliabilityTier, { label: string; tone: string }> = {
  full: { label: "FULL TIER", tone: "pill-verified" },
  low: { label: "LOW RELIABILITY", tone: "pill-warning" },
  insufficient: { label: "INSUFFICIENT DATA", tone: "pill-danger" },
};

interface Props {
  tier: ReliabilityTier;
  status?: RunStatus;
  asOfDate?: string;
  mic?: string;
}

export function ReliabilityBadge({ tier, status, asOfDate, mic }: Props) {
  const tierMeta = TIER_PILL[tier];

  return (
    <div className="badges-row">
      {asOfDate && <span className="pill pill-muted">DATA AS OF {asOfDate}</span>}
      {mic && <span className="pill pill-muted">EXCHANGE {mic}</span>}
      <span className={`pill ${tierMeta.tone}`}>
        <span className="geo-dot" aria-hidden="true" />
        {tierMeta.label}
      </span>
      {status && status !== "ok" && (
        <span className={`pill ${status === "failed" ? "pill-danger" : "pill-warning"}`}>
          {status === "degraded" ? "DEGRADED" : status.toUpperCase()}
        </span>
      )}
    </div>
  );
}

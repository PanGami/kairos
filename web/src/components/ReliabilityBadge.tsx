import type { ReliabilityTier, RunStatus } from "../types/api.types";

const TIER_TEXT: Record<ReliabilityTier, string> = {
  full: "Reliability: full",
  low: "Reliability: low (interpret with caution)",
  insufficient: "Reliability: insufficient history",
};

interface Props {
  tier: ReliabilityTier;
  status?: RunStatus;
}

export function ReliabilityBadge({ tier, status }: Props) {
  return (
    <div className="badges">
      <span className={`badge tier-${tier}`}>{TIER_TEXT[tier]}</span>
      {status && status !== "ok" && <span className="badge status-degraded">Status: {status}</span>}
    </div>
  );
}

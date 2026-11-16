import { useLocale } from "../hooks/useLocale";
import type { ReliabilityTier, RunStatus } from "../types/api.types";
import { formatPrice } from "../utils/format";
import { getTierBadge } from "../utils/tierBadge";
import { AnimatedValue } from "./AnimatedValue";

interface Props {
  instrumentId?: string;
  lastPrice?: number;
  currency?: string;
  tier: ReliabilityTier;
  status?: RunStatus;
  asOfDate?: string;
  mic?: string;
}

export function ReliabilityBadge({
  instrumentId,
  lastPrice,
  currency = "IDR",
  tier,
  status,
  asOfDate,
  mic,
}: Props) {
  const { t } = useLocale();
  const tierMeta = getTierBadge(tier, t);

  return (
    <div className="quote-summary">
      <div className="quote-identity">
        {instrumentId && <span className="quote-ticker">{instrumentId}</span>}
        {mic && <span className="pill pill-muted">{mic}</span>}
        <span className={`pill ${tierMeta.tone}`}>{tierMeta.label}</span>
        {status && status !== "ok" && (
          <span className={`pill ${status === "failed" ? "pill-danger" : "pill-warning"}`}>
            {status === "degraded" ? t.badges.degraded : status.toUpperCase()}
          </span>
        )}
      </div>

      <div className="quote-metrics">
        {lastPrice !== undefined && (
          <span className="quote-price">
            {t.badges.lastClose} <AnimatedValue value={lastPrice} format={formatPrice} /> {currency}
          </span>
        )}
        {asOfDate && <span className="meta-provenance-item">{t.badges.asOf} {asOfDate}</span>}
      </div>
    </div>
  );
}

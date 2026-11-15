import { useLocale } from "../hooks/useLocale";
import type { Messages } from "../i18n/messages";
import type { ReliabilityTier, RunStatus } from "../types/api.types";
import { formatPrice } from "../utils/format";

function getTierMeta(tier: ReliabilityTier, t: Messages): { label: string; tone: string } {
  switch (tier) {
    case "full":
      return { label: t.watchlist.fullTier, tone: "pill-verified" };
    case "low":
      return { label: t.watchlist.lowReliability, tone: "pill-warning" };
    case "insufficient":
      return { label: t.watchlist.insufficientData, tone: "pill-danger" };
  }
}

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
  const tierMeta = getTierMeta(tier, t);

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
            {t.badges.lastClose} {formatPrice(lastPrice)} {currency}
          </span>
        )}
        {asOfDate && <span className="meta-provenance-item">{t.badges.asOf} {asOfDate}</span>}
      </div>
    </div>
  );
}

import { useLocale } from "../hooks/useLocale";
import type { Messages } from "../i18n/messages";
import type { Instrument, ReliabilityTier } from "../types/api.types";
import { formatPrice } from "../utils/format";

interface Props {
  instruments: Instrument[];
  value: string | null;
  featuredId: string | null;
  isGuest: boolean;
  activeLastPrice?: number;
  currency?: string;
  onChange: (id: string) => void;
  onLockedClick: (instrument: Instrument) => void;
}

function tierBadge(tier: ReliabilityTier, t: Messages): { label: string; tone: string } {
  switch (tier) {
    case "full":
      return { label: t.watchlist.fullTier, tone: "pill-verified" };
    case "low":
      return { label: t.watchlist.lowReliability, tone: "pill-warning" };
    case "insufficient":
      return { label: t.watchlist.insufficientData, tone: "pill-danger" };
  }
}

export function InstrumentSelect({
  instruments,
  value,
  featuredId,
  isGuest,
  activeLastPrice,
  currency = "IDR",
  onChange,
  onLockedClick,
}: Props) {
  const { t } = useLocale();

  return (
    <section className="terminal-widget watchlist-panel" aria-label={t.watchlist.panelAriaLabel}>
      <div className="widget-header">
        <span className="widget-title">{t.watchlist.title}</span>
        <span className="widget-meta">{t.watchlist.tickersCount(instruments.length)}</span>
      </div>
      <div className="watchlist-list" role="group" aria-label={t.watchlist.listAriaLabel}>
        {instruments.map((inst) => {
          const isFeatured = inst.instrument_id === featuredId;
          const isLocked = isGuest && !isFeatured;
          const isSelected = inst.instrument_id === value;
          const badge = tierBadge(inst.reliability_tier, t);
          const showActivePrice = isSelected && activeLastPrice !== undefined;

          return (
            <button
              key={inst.instrument_id}
              type="button"
              className={`emitter-btn${isSelected ? " active" : ""}${isLocked ? " locked" : ""}`}
              aria-pressed={isSelected}
              onClick={() => (isLocked ? onLockedClick(inst) : onChange(inst.instrument_id))}
            >
              <div className="emitter-top">
                <span className="emitter-ticker">{inst.instrument_id}</span>
                {showActivePrice && (
                  <span className="emitter-price">
                    {formatPrice(activeLastPrice)} {currency}
                  </span>
                )}
              </div>
              <div className="emitter-pills">
                <span className="emitter-mic">{inst.mic}</span>
                {isFeatured && <span className="pill pill-cyan">{t.watchlist.featuredToday}</span>}
                {isLocked ? (
                  <span className="pill pill-muted">{t.watchlist.locked}</span>
                ) : (
                  <span className={`pill ${badge.tone}`}>{badge.label}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

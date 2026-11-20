import { useLocale } from "../hooks/useLocale";
import type { Instrument } from "../types/api.types";
import { formatPrice } from "../utils/format";
import { pickWatchlist, rankByConfidence } from "../utils/instrumentRanking";
import { getTierBadge } from "../utils/tierBadge";
import { AnimatedValue } from "./AnimatedValue";

interface Props {
  instruments: Instrument[];
  value: string | null;
  featuredId: string | null;
  isGuest: boolean;
  activeLastPrice?: number;
  currency?: string;
  onChange: (id: string) => void;
  onLockedClick: (instrument: Instrument) => void;
  onOpenSearch: () => void;
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
  onOpenSearch,
}: Props) {
  const { t } = useLocale();
  const ranked = rankByConfidence(instruments, featuredId);
  const visible = pickWatchlist(ranked, value);
  const hiddenCount = instruments.length - visible.length;

  return (
    <section className="terminal-widget watchlist-panel" aria-label={t.watchlist.panelAriaLabel}>
      <div className="widget-header">
        <span className="widget-title">{t.watchlist.title}</span>
        <span className="widget-meta">{t.watchlist.tickersCount(visible.length)}</span>
      </div>
      <div className="watchlist-list" role="group" aria-label={t.watchlist.listAriaLabel}>
        {visible.map((inst) => {
          const isFeatured = inst.instrument_id === featuredId;
          const isLocked = isGuest && !isFeatured;
          const isSelected = inst.instrument_id === value;
          const badge = getTierBadge(inst.reliability_tier, t);
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
                    <AnimatedValue value={activeLastPrice} format={formatPrice} /> {currency}
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

      <div className="watchlist-footer">
        {hiddenCount > 0 && (
          <p className="watchlist-footnote">{t.tickerSearch.watchlist.showingTop(visible.length, instruments.length)}</p>
        )}
        <button
          type="button"
          className="btn btn-secondary watchlist-browse-btn"
          aria-haspopup="dialog"
          aria-label={t.tickerSearch.watchlist.browseAriaLabel}
          onClick={onOpenSearch}
        >
          {t.tickerSearch.watchlist.browseAll(instruments.length)}
        </button>
      </div>
    </section>
  );
}

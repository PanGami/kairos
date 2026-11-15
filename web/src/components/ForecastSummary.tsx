import { useLocale } from "../hooks/useLocale";
import type { Forecast } from "../types/api.types";
import { formatPct, formatPrice } from "../utils/format";

export function ForecastSummary({ f, currency = "IDR" }: { f: Forecast; currency?: string }) {
  const { t } = useLocale();
  const s = t.forecastSummary;

  return (
    <>
      <section className="terminal-widget cone-widget" aria-label={s.coneAriaLabel}>
        <div className="widget-header">
          <span className="widget-title">{s.coneTitle}</span>
          <span className="widget-meta">{s.horizonMeta(f.horizon_days)}</span>
        </div>
        <div className="cone-body">
          <div className="readout-primary-label">{s.range80Label}</div>
          <div className="readout-primary-value">
            {formatPrice(f.lower80)} {s.rangeConnector} {formatPrice(f.upper80)} {currency}
          </div>
          <div className="keystats-table">
            <div className="keystats-row">
              <span className="keystats-label">{s.interval95Label}</span>
              <span className="keystats-value">
                {formatPrice(f.lower95)} {s.rangeConnector} {formatPrice(f.upper95)} {currency}
              </span>
            </div>
            <div className="keystats-row">
              <span className="keystats-label">{s.forwardMedianLabel}</span>
              <span className="keystats-value">
                {formatPrice(f.median)} {currency}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="terminal-widget keystats-widget" aria-label={s.volAriaLabel}>
        <div className="widget-header">
          <span className="widget-title">{s.volTitle}</span>
          <span className="widget-meta">{s.volMeta}</span>
        </div>
        <div className="keystats-table keystats-padded">
          <div className="keystats-row">
            <span className="keystats-label">{s.annualizedVol}</span>
            <span className="keystats-value">{formatPct(f.volatility.annualized)}</span>
          </div>
          <div className="keystats-row">
            <span className="keystats-label">{s.dailyVol}</span>
            <span className="keystats-value">{formatPct(f.volatility.daily, 2)}</span>
          </div>
          <div className="keystats-row">
            <span className="keystats-label">{s.volBand}</span>
            <span className="keystats-value">
              {formatPct(f.volatility.lower)} {s.rangeConnector} {formatPct(f.volatility.upper)}
            </span>
          </div>
        </div>
      </section>

      <section className="terminal-widget keystats-widget" aria-label={s.drawdownAriaLabel}>
        <div className="widget-header">
          <span className="widget-title">{s.drawdownTitle}</span>
          <span className="widget-meta">{s.drawdownMeta}</span>
        </div>
        <div className="keystats-table keystats-padded">
          <div className="keystats-row">
            <span className="keystats-label">{s.correctionProb}</span>
            <span className="keystats-value">{formatPct(f.correction.probability)}</span>
          </div>
          <div className="keystats-row">
            <span className="keystats-label">{s.drawdownThreshold}</span>
            <span className="keystats-value">theta {formatPct(f.correction.theta, 1)}</span>
          </div>
          <div className="keystats-row">
            <span className="keystats-label">{s.baseRate252d}</span>
            <span className="keystats-value">{formatPct(f.correction.rolling_base_rate)}</span>
          </div>
        </div>
      </section>
    </>
  );
}

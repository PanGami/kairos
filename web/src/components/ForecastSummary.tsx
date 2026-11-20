import { useLocale } from "../hooks/useLocale";
import type { Forecast } from "../types/api.types";
import { formatPct, formatPrice } from "../utils/format";
import { AnimatedValue } from "./AnimatedValue";

export function ForecastSummary({ f, currency = "IDR" }: { f: Forecast; currency?: string }) {
  const { t } = useLocale();
  const s = t.forecastSummary;
  const pct1 = (n: number) => formatPct(n, 1);
  const pct2 = (n: number) => formatPct(n, 2);

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
            <AnimatedValue value={f.lower80} format={formatPrice} /> {s.rangeConnector}{" "}
            <AnimatedValue value={f.upper80} format={formatPrice} /> {currency}
          </div>
          <div className="keystats-table">
            <div className="keystats-row">
              <span className="keystats-label">{s.interval95Label}</span>
              <span className="keystats-value">
                <AnimatedValue value={f.lower95} format={formatPrice} /> {s.rangeConnector}{" "}
                <AnimatedValue value={f.upper95} format={formatPrice} /> {currency}
              </span>
            </div>
            <div className="keystats-row">
              <span className="keystats-label">{s.forwardMedianLabel}</span>
              <span className="keystats-value">
                <AnimatedValue value={f.median} format={formatPrice} /> {currency}
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
            <span className="keystats-value">
              <AnimatedValue value={f.volatility.annualized} format={pct1} />
            </span>
          </div>
          <div className="keystats-row">
            <span className="keystats-label">{s.dailyVol}</span>
            <span className="keystats-value">
              <AnimatedValue value={f.volatility.daily} format={pct2} />
            </span>
          </div>
          <div className="keystats-row">
            <span className="keystats-label">{s.volBand}</span>
            <span className="keystats-value">
              <AnimatedValue value={f.volatility.lower} format={pct1} /> {s.rangeConnector}{" "}
              <AnimatedValue value={f.volatility.upper} format={pct1} />
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
            <span className="keystats-value">
              <AnimatedValue value={f.correction.probability} format={pct1} />
            </span>
          </div>
          <div className="keystats-row">
            <span className="keystats-label">{s.drawdownThreshold}</span>
            <span className="keystats-value">
              theta <AnimatedValue value={f.correction.theta} format={pct1} />
            </span>
          </div>
          <div className="keystats-row">
            <span className="keystats-label">{s.baseRate252d}</span>
            <span className="keystats-value">
              <AnimatedValue value={f.correction.rolling_base_rate} format={pct1} />
            </span>
          </div>
        </div>
      </section>
    </>
  );
}

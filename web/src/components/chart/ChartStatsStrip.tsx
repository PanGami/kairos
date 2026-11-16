import { useLocale } from "../../hooks/useLocale";
import { formatPrice, formatSignedPct, formatVolume } from "../../utils/format";
import type { PriceStats } from "../../utils/priceStats";

interface Props {
  stats: PriceStats;
  currency?: string;
}

/** High, low, 52 week, volume and range change for the window currently in view. */
export function ChartStatsStrip({ stats, currency = "IDR" }: Props) {
  const { t } = useLocale();
  const s = t.chartUi.stats;
  const price = (v: number | undefined) => (v === undefined ? "N/A" : `${formatPrice(v)} ${currency}`);

  const cells: Array<{ label: string; value: string; tone?: string }> = [
    { label: s.rangeHigh, value: price(stats.range?.high) },
    { label: s.rangeLow, value: price(stats.range?.low) },
    { label: s.high52w, value: price(stats.week52?.high) },
    { label: s.low52w, value: price(stats.week52?.low) },
    { label: s.avgVolume20d, value: stats.avgVolume20 === null ? "N/A" : formatVolume(stats.avgVolume20) },
    {
      label: s.rangeChange,
      value: stats.rangeChangePct === null ? "N/A" : formatSignedPct(stats.rangeChangePct),
      tone: stats.rangeChangePct !== null && stats.rangeChangePct < 0 ? "tone-down" : "tone-up",
    },
  ];

  return (
    <div className="chart-stats" role="group" aria-label={s.ariaLabel}>
      <dl className="chart-stats-grid">
        {cells.map((cell) => (
          <div key={cell.label} className="chart-stat">
            <dt className="chart-stat-label">{cell.label}</dt>
            <dd className={`chart-stat-value ${cell.tone ?? ""}`}>{cell.value}</dd>
          </div>
        ))}
      </dl>
      <p className="chart-stats-note">{s.note(stats.barsInRange)}</p>
    </div>
  );
}

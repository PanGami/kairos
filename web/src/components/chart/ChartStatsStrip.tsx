import { useLocale } from "../../hooks/useLocale";
import { formatPrice, formatSignedPct, formatVolume } from "../../utils/format";
import type { PriceStats } from "../../utils/priceStats";
import { AnimatedValue } from "../AnimatedValue";

interface Props {
  stats: PriceStats;
  currency?: string;
}

/** High, low, 52 week, volume and range change for the window currently in view. */
export function ChartStatsStrip({ stats, currency = "IDR" }: Props) {
  const { t } = useLocale();
  const s = t.chartUi.stats;

  const renderPrice = (v: number | undefined) =>
    v === undefined ? (
      "N/A"
    ) : (
      <>
        <AnimatedValue value={v} format={formatPrice} /> {currency}
      </>
    );

  const cells = [
    { label: s.rangeHigh, content: renderPrice(stats.range?.high) },
    { label: s.rangeLow, content: renderPrice(stats.range?.low) },
    { label: s.high52w, content: renderPrice(stats.week52?.high) },
    { label: s.low52w, content: renderPrice(stats.week52?.low) },
    {
      label: s.avgVolume20d,
      content: stats.avgVolume20 === null ? "N/A" : <AnimatedValue value={stats.avgVolume20} format={formatVolume} />,
    },
    {
      label: s.rangeChange,
      content:
        stats.rangeChangePct === null ? (
          "N/A"
        ) : (
          <AnimatedValue value={stats.rangeChangePct} format={formatSignedPct} />
        ),
      tone: stats.rangeChangePct !== null && stats.rangeChangePct < 0 ? "tone-down" : "tone-up",
    },
  ];

  return (
    <div className="chart-stats" role="group" aria-label={s.ariaLabel}>
      <dl className="chart-stats-grid">
        {cells.map((cell) => (
          <div key={cell.label} className="chart-stat">
            <dt className="chart-stat-label">{cell.label}</dt>
            <dd className={`chart-stat-value ${cell.tone ?? ""}`}>{cell.content}</dd>
          </div>
        ))}
      </dl>
      <p className="chart-stats-note">{s.note(stats.barsInRange)}</p>
    </div>
  );
}

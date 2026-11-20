import { useEffect, useMemo, useRef, useState } from "react";
import type { ChartPrefsApi } from "../hooks/useChartPrefs";
import { useLocale } from "../hooks/useLocale";
import type { Theme } from "../hooks/useTheme";
import type { Horizon } from "../types/api.types";
import type { ChartSeries } from "../utils/chartData";
import { computeIndicators } from "../utils/indicators";
import { computePriceStats } from "../utils/priceStats";
import { buildLookup, type HoverSnapshot } from "./chart/chartLookup";
import { getPalette } from "./chart/chartTheme";
import { ChartLayerLegend } from "./chart/ChartLayerLegend";
import { ChartReadout } from "./chart/ChartReadout";
import { ChartStatsStrip } from "./chart/ChartStatsStrip";
import { ChartToolbar } from "./chart/ChartToolbar";
import { mountChart } from "./chart/mountChart";

interface Props {
  series: ChartSeries;
  theme: Theme;
  chartPrefs: ChartPrefsApi;
  instrumentId?: string;
  mic?: string;
  currency?: string;
  horizonDays: Horizon;
  loading?: boolean;
  onOpenSearch: () => void;
}

export function PriceChart({
  series,
  theme,
  chartPrefs,
  instrumentId,
  mic,
  currency,
  horizonDays,
  loading = false,
  onOpenSearch,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useLocale();
  const c = t.chart;
  const { prefs } = chartPrefs;
  const [hover, setHover] = useState<HoverSnapshot | null>(null);

  const derived = useMemo(() => computeIndicators(series.candles), [series.candles]);
  const lookup = useMemo(() => buildLookup(series.candles, derived), [series.candles, derived]);
  const stats = useMemo(() => computePriceStats(series.candles, prefs.range), [series.candles, prefs.range]);

  useEffect(() => {
    if (!ref.current) return undefined;
    setHover(null);
    return mountChart({
      container: ref.current,
      palette: getPalette(theme),
      series,
      derived,
      prefs,
      horizonDays,
      labels: t.chartUi.series,
      lookup,
      onHover: setHover,
    });
  }, [series, derived, lookup, theme, prefs, horizonDays, t.chartUi.series]);

  const shown = hover ?? lookup.last;

  return (
    <section className="chart-panel" aria-label={c.sectionAriaLabel}>
      <div className="chart-header">
        <div className="chart-title-row">
          <h1 className="chart-title">
            {instrumentId ? c.titleWithTicker(instrumentId, horizonDays) : c.titleNoTicker(horizonDays)}
          </h1>
          {loading && (
            <span className="pill pill-cyan" role="status">
              {c.updating(horizonDays)}
            </span>
          )}
        </div>
        <p className="chart-subtitle">{c.subtitle(horizonDays)}</p>
      </div>

      <ChartToolbar instrumentId={instrumentId} chartPrefs={chartPrefs} onOpenSearch={onOpenSearch} />
      <ChartReadout instrumentId={instrumentId} mic={mic} snapshot={shown} prefs={prefs} />

      <div
        ref={ref}
        className="chart-canvas"
        role="img"
        aria-label={t.chartUi.canvasAriaLabel(
          instrumentId ?? "Instrument",
          t.chartUi.types[prefs.type].toLowerCase(),
          horizonDays,
        )}
      />

      <ChartLayerLegend prefs={prefs} />
      <ChartStatsStrip stats={stats} currency={currency} />
    </section>
  );
}

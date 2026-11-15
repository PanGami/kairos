import {
  ColorType,
  LineStyle,
  createChart,
  type IChartApi,
  type Time,
} from "lightweight-charts";
import { useEffect, useRef } from "react";
import { useLocale } from "../hooks/useLocale";
import type { Theme } from "../hooks/useTheme";
import type { Horizon } from "../types/api.types";
import type { ChartSeries, LinePoint } from "../utils/chartData";

interface Props {
  series: ChartSeries;
  theme: Theme;
  instrumentId?: string;
  horizonDays: Horizon;
  loading?: boolean;
}

const toData = (pts: LinePoint[]) => pts.map((p) => ({ time: p.time as Time, value: p.value }));

export function PriceChart({ series, theme, instrumentId, horizonDays, loading = false }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useLocale();
  const c = t.chart;

  useEffect(() => {
    if (!ref.current) return;
    const dark = theme === "dark";
    const textColor = dark ? "#9CA3AF" : "#525B68";
    const gridColor = dark ? "#2A2A2A" : "#E0E4EA";
    const actualColor = dark ? "#F3F4F6" : "#121212";
    const backtestColor = dark ? "#9CA3AF" : "#525B68";
    const coreCyan = dark ? "#00AB6B" : "#006B42";
    const warningColor = dark ? "#F59E0B" : "#92400E";

    const chart: IChartApi = createChart(ref.current, {
      height: 420,
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor,
        fontFamily: "'JetBrains Mono', monospace",
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
    });

    const line = (
      color: string,
      width: 1 | 2,
      style: LineStyle,
      pts: LinePoint[],
      title?: string,
      showLastValue = false,
    ) => {
      const s = chart.addLineSeries({
        color,
        lineWidth: width,
        lineStyle: style,
        title,
        priceLineVisible: false,
        lastValueVisible: showLastValue,
      });
      s.setData(toData(pts));
    };

    line(actualColor, 2, LineStyle.Solid, series.actual, c.seriesActual);
    line(backtestColor, 1, LineStyle.Dotted, series.backtestMedian, c.seriesBacktest);
    line(coreCyan, 2, LineStyle.Solid, series.forecastMedian, c.seriesMedian, true);
    line(coreCyan, 1, LineStyle.Dashed, series.upper80, c.seriesUpper80, true);
    line(coreCyan, 1, LineStyle.Dashed, series.lower80, c.seriesLower80, true);
    line(warningColor, 1, LineStyle.Dotted, series.upper95, c.seriesUpper95);
    line(warningColor, 1, LineStyle.Dotted, series.lower95, c.seriesLower95);

    chart.timeScale().fitContent();
    return () => chart.remove();
  }, [series, theme, c]);

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
        <div className="chart-legend" role="region" aria-label={c.legendAriaLabel}>
          <span className="legend-item">
            <span className="legend-swatch swatch-actual" aria-hidden="true" />
            {c.legendActual}
          </span>
          <span className="legend-item">
            <span className="legend-swatch swatch-backtest" aria-hidden="true" />
            {c.legendBacktest}
          </span>
          <span className="legend-item">
            <span className="legend-swatch swatch-forecast" aria-hidden="true" />
            {c.legendMedian}
          </span>
          <span className="legend-item">
            <span className="legend-swatch swatch-80" aria-hidden="true" />
            {c.legend80}
          </span>
          <span className="legend-item">
            <span className="legend-swatch swatch-95" aria-hidden="true" />
            {c.legend95}
          </span>
        </div>
      </div>
      <div
        ref={ref}
        className="chart-canvas"
        role="img"
        aria-label={c.canvasAriaLabel(instrumentId ?? "Instrument", horizonDays)}
      />
    </section>
  );
}

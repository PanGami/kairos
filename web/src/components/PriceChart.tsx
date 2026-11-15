import {
  ColorType,
  LineStyle,
  createChart,
  type IChartApi,
  type Time,
} from "lightweight-charts";
import { useEffect, useRef } from "react";
import type { Theme } from "../hooks/useTheme";
import type { ChartSeries, LinePoint } from "../utils/chartData";

interface Props {
  series: ChartSeries;
  theme: Theme;
  instrumentId?: string;
}

const toData = (pts: LinePoint[]) => pts.map((p) => ({ time: p.time as Time, value: p.value }));

export function PriceChart({ series, theme, instrumentId }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const dark = theme === "dark";
    const textColor = dark ? "#8FA3C0" : "#4B5E7A";
    const gridColor = dark ? "#1E2D4A" : "#D8E1EE";
    const actualColor = dark ? "#EDF2F8" : "#0A101D";
    const backtestColor = dark ? "#8FA3C0" : "#4B5E7A";
    const coreCyan = dark ? "#0EA5E9" : "#0284C7";
    const warningColor = dark ? "#EAB308" : "#CA8A04";

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

    const line = (color: string, width: 1 | 2, style: LineStyle, pts: LinePoint[], title?: string) => {
      const s = chart.addLineSeries({
        color,
        lineWidth: width,
        lineStyle: style,
        title,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      s.setData(toData(pts));
    };

    line(actualColor, 2, LineStyle.Solid, series.actual, "Actual");
    line(backtestColor, 1, LineStyle.Dotted, series.backtestMedian, "Backtest median");
    line(coreCyan, 2, LineStyle.Solid, series.forecastMedian, "Forecast median");
    line(coreCyan, 1, LineStyle.Dashed, series.upper80, "80% upper");
    line(coreCyan, 1, LineStyle.Dashed, series.lower80, "80% lower");
    line(warningColor, 1, LineStyle.Dotted, series.upper95, "95% upper");
    line(warningColor, 1, LineStyle.Dotted, series.lower95, "95% lower");

    chart.timeScale().fitContent();
    return () => chart.remove();
  }, [series, theme]);

  return (
    <section className="chart-panel" aria-label="Uncertainty envelope and price chart">
      <div className="chart-header">
        <h2 className="chart-title">
          {instrumentId ? `${instrumentId} Risk Envelope` : "Risk Envelope"}
        </h2>
        <div className="chart-legend" role="region" aria-label="Chart series legend">
          <span className="legend-item">
            <span className="legend-swatch swatch-actual" aria-hidden="true" />
            ACTUAL CLOSE
          </span>
          <span className="legend-item">
            <span className="legend-swatch swatch-backtest" aria-hidden="true" />
            WALK-FORWARD BACKTEST
          </span>
          <span className="legend-item">
            <span className="legend-swatch swatch-forecast" aria-hidden="true" />
            FORWARD MEDIAN
          </span>
          <span className="legend-item">
            <span className="legend-swatch swatch-80" aria-hidden="true" />
            80% INTERVAL
          </span>
          <span className="legend-item">
            <span className="legend-swatch swatch-95" aria-hidden="true" />
            95% INTERVAL
          </span>
        </div>
      </div>
      <div ref={ref} className="chart-canvas" />
    </section>
  );
}

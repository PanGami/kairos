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
}

const toData = (pts: LinePoint[]) => pts.map((p) => ({ time: p.time as Time, value: p.value }));

export function PriceChart({ series, theme }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const dark = theme === "dark";
    const chart: IChartApi = createChart(ref.current, {
      height: 420,
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: dark ? "#c9d1d9" : "#334155",
      },
      grid: {
        vertLines: { color: dark ? "#21262d" : "#e5e7eb" },
        horzLines: { color: dark ? "#21262d" : "#e5e7eb" },
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

    line(dark ? "#e6edf3" : "#0f172a", 2, LineStyle.Solid, series.actual, "Actual");
    line("#94a3b8", 1, LineStyle.Dotted, series.backtestMedian, "Backtest median");
    line("#2563eb", 2, LineStyle.Solid, series.forecastMedian, "Forecast median");
    line("#2563eb", 1, LineStyle.Dashed, series.upper80, "80% upper");
    line("#2563eb", 1, LineStyle.Dashed, series.lower80, "80% lower");
    line("#f59e0b", 1, LineStyle.Dotted, series.upper95, "95% upper");
    line("#f59e0b", 1, LineStyle.Dotted, series.lower95, "95% lower");

    chart.timeScale().fitContent();
    return () => chart.remove();
  }, [series, theme]);

  return <div ref={ref} className="chart" />;
}

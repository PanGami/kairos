import {
  ColorType,
  CrosshairMode,
  LineStyle,
  createChart,
  type IChartApi,
  type MouseEventParams,
  type Time,
} from "lightweight-charts";
import type { ChartUiMessages } from "../../i18n/chart.messages";
import type { ChartSeries, LinePoint } from "../../utils/chartData";
import type { ChartPrefs } from "../../utils/chartPrefs";
import type { DerivedIndicators } from "../../utils/indicators";
import { RANGE_BARS } from "../../utils/priceStats";
import { timeKey, type ChartLookup, type HoverSnapshot } from "./chartLookup";
import { withAlpha, type ChartPalette } from "./chartTheme";

export interface MountChartOptions {
  container: HTMLElement;
  palette: ChartPalette;
  series: ChartSeries;
  derived: DerivedIndicators;
  prefs: ChartPrefs;
  horizonDays: number;
  labels: ChartUiMessages["series"];
  lookup: ChartLookup;
  onHover: (snapshot: HoverSnapshot | null) => void;
}

const toLine = (pts: LinePoint[]) => pts.map((p) => ({ time: p.time as Time, value: p.value }));

/** Builds the chart for the current prefs and returns a disposer. The caller rebuilds when inputs change. */
export function mountChart(o: MountChartOptions): () => void {
  const { palette: p, series, derived, prefs, labels } = o;
  const on = prefs.indicators;
  const coneVisible = on.cone80 || on.cone95;

  const chart: IChartApi = createChart(o.container, {
    autoSize: true,
    layout: {
      background: { type: ColorType.Solid, color: "transparent" },
      textColor: p.text,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12,
    },
    grid: { vertLines: { color: p.grid }, horzLines: { color: p.grid } },
    crosshair: {
      mode: CrosshairMode.Normal,
      vertLine: { color: p.crosshair, style: LineStyle.Dashed, labelBackgroundColor: p.crosshairLabelBg },
      horzLine: { color: p.crosshair, style: LineStyle.Dashed, labelBackgroundColor: p.crosshairLabelBg },
    },
    rightPriceScale: {
      borderVisible: false,
      scaleMargins: { top: 0.06, bottom: on.volume ? 0.24 : 0.08 },
    },
    timeScale: { borderVisible: false, rightOffset: 0 },
  });

  const overlay = (color: string, pts: LinePoint[], style = LineStyle.Solid, width: 1 | 2 = 1) => {
    const s = chart.addLineSeries({
      color,
      lineWidth: width,
      lineStyle: style,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });
    s.setData(toLine(pts));
  };

  // Volume first so it renders beneath the price series.
  if (on.volume) {
    const volume = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "",
      lastValueVisible: false,
      priceLineVisible: false,
    });
    volume.priceScale().applyOptions({ scaleMargins: { top: 0.84, bottom: 0 } });
    volume.setData(
      series.candles.map((c) => ({
        time: c.time as Time,
        value: c.volume,
        color: withAlpha(c.close >= c.open ? p.up : p.down, 0.45),
      })),
    );
  }

  if (prefs.type === "candles") {
    const price = chart.addCandlestickSeries({
      upColor: p.up,
      downColor: p.down,
      borderUpColor: p.up,
      borderDownColor: p.down,
      wickUpColor: p.up,
      wickDownColor: p.down,
      priceLineStyle: LineStyle.Dotted,
      title: labels.price,
    });
    price.setData(
      series.candles.map((c) => ({ time: c.time as Time, open: c.open, high: c.high, low: c.low, close: c.close })),
    );
  } else if (prefs.type === "area") {
    const price = chart.addAreaSeries({
      lineColor: p.up,
      lineWidth: 2,
      topColor: withAlpha(p.up, 0.32),
      bottomColor: withAlpha(p.up, 0.02),
      priceLineStyle: LineStyle.Dotted,
      title: labels.price,
    });
    price.setData(series.candles.map((c) => ({ time: c.time as Time, value: c.close })));
  } else {
    const price = chart.addLineSeries({
      color: p.price,
      lineWidth: 2,
      priceLineStyle: LineStyle.Dotted,
      title: labels.price,
    });
    price.setData(series.candles.map((c) => ({ time: c.time as Time, value: c.close })));
  }

  if (on.bollinger) {
    overlay(p.bollinger, derived.bollinger.upper);
    overlay(p.bollinger, derived.bollinger.lower);
    overlay(p.bollinger, derived.bollinger.middle, LineStyle.Dashed);
  }
  if (on.sma20) overlay(p.sma20, derived.sma20);
  if (on.sma50) overlay(p.sma50, derived.sma50);
  if (on.backtest) overlay(p.backtest, series.backtestMedian, LineStyle.Dotted);

  if (coneVisible) overlay(p.cone, series.forecastMedian, LineStyle.Solid, 2);
  const bound = (color: string, pts: LinePoint[], style: LineStyle, title: string) => {
    const s = chart.addLineSeries({
      color,
      lineWidth: 1,
      lineStyle: style,
      title,
      priceLineVisible: false,
      lastValueVisible: true,
      crosshairMarkerVisible: false,
    });
    s.setData(toLine(pts));
  };
  if (on.cone80) {
    bound(p.cone, series.upper80, LineStyle.Dashed, labels.upper80);
    bound(p.cone, series.lower80, LineStyle.Dashed, labels.lower80);
  }
  if (on.cone95) {
    bound(p.warning, series.upper95, LineStyle.Dotted, labels.upper95);
    bound(p.warning, series.lower95, LineStyle.Dotted, labels.lower95);
  }

  // Visible window: last N sessions plus room on the right for the forward cone.
  const bars = series.candles.length;
  const span = RANGE_BARS[prefs.range];
  const from = Number.isFinite(span) ? Math.max(0, bars - span) - 0.5 : -0.5;
  const rightPad = coneVisible ? o.horizonDays + 2 : 3;
  chart.timeScale().setVisibleLogicalRange({ from, to: bars - 1 + rightPad });

  const onMove = (param: MouseEventParams<Time>) => {
    if (!param.time) {
      o.onHover(null);
      return;
    }
    o.onHover(o.lookup.byTime.get(timeKey(param.time)) ?? null);
  };
  chart.subscribeCrosshairMove(onMove);

  return () => {
    chart.unsubscribeCrosshairMove(onMove);
    chart.remove();
  };
}

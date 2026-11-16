import type { Forecast, History, Horizon } from "../types/api.types";
import { addTradingDays } from "./dates";

export interface LinePoint {
  time: string;
  value: number;
}

export interface CandlePoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ChartSeries {
  candles: CandlePoint[];
  backtestMedian: LinePoint[];
  forecastMedian: LinePoint[];
  upper80: LinePoint[];
  lower80: LinePoint[];
  upper95: LinePoint[];
  lower95: LinePoint[];
}

/** Backtest origin -> target date = origin + h trading days (looked up in the actual series). */
function buildBacktest(history: History, horizon: Horizon): LinePoint[] {
  const dates = history.actual.map((a) => a.date);
  const idx = new Map(dates.map((d, i) => [d, i]));
  const out: LinePoint[] = [];
  for (const b of history.backtest) {
    if (b.horizon_days !== horizon) continue;
    const i = idx.get(b.as_of_date);
    if (i === undefined || i + horizon >= dates.length) continue;
    out.push({ time: dates[i + horizon], value: b.median });
  }
  return out;
}

/**
 * Keeps OHLC internally consistent: a missing or inverted bar is repaired so
 * high >= max(open, close) and low <= min(open, close), and the chart never throws.
 */
function toCandle(a: History["actual"][number]): CandlePoint {
  const close = a.close;
  const open = Number.isFinite(a.open) && a.open > 0 ? a.open : close;
  const high = Math.max(Number.isFinite(a.high) && a.high > 0 ? a.high : close, open, close);
  const low = Math.min(Number.isFinite(a.low) && a.low > 0 ? a.low : close, open, close);
  return { time: a.date, open, high, low, close, volume: Math.max(0, a.volume ?? 0) };
}

export function buildChartSeries(history: History, forecast: Forecast, horizon: Horizon): ChartSeries {
  const pick = (f: (p: Forecast["path"][number]) => number): LinePoint[] =>
    forecast.path.map((p) => ({ time: addTradingDays(forecast.as_of_date, p.step), value: f(p) }));
  return {
    candles: history.actual.map(toCandle),
    backtestMedian: buildBacktest(history, horizon),
    forecastMedian: pick((p) => p.median),
    upper80: pick((p) => p.upper80),
    lower80: pick((p) => p.lower80),
    upper95: pick((p) => p.upper95),
    lower95: pick((p) => p.lower95),
  };
}

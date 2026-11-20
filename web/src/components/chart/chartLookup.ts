import type { Time } from "lightweight-charts";
import type { CandlePoint } from "../../utils/chartData";
import type { DerivedIndicators } from "../../utils/indicators";

export interface HoverSnapshot {
  time: string;
  candle: CandlePoint;
  /** Previous session close, used for the day change readout. */
  prevClose: number | null;
  sma20?: number;
  sma50?: number;
  bbUpper?: number;
  bbLower?: number;
}

export interface ChartLookup {
  byTime: Map<string, HoverSnapshot>;
  last: HoverSnapshot | null;
}

/** lightweight-charts reports string, unix, or business-day times depending on how data was supplied. */
export function timeKey(t: Time): string {
  if (typeof t === "string") return t;
  if (typeof t === "number") return new Date(t * 1000).toISOString().slice(0, 10);
  const mm = String(t.month).padStart(2, "0");
  const dd = String(t.day).padStart(2, "0");
  return `${t.year}-${mm}-${dd}`;
}

export function buildLookup(candles: CandlePoint[], derived: DerivedIndicators): ChartLookup {
  const toMap = (pts: Array<{ time: string; value: number }>) => new Map(pts.map((p) => [p.time, p.value]));
  const sma20 = toMap(derived.sma20);
  const sma50 = toMap(derived.sma50);
  const bbUpper = toMap(derived.bollinger.upper);
  const bbLower = toMap(derived.bollinger.lower);

  const byTime = new Map<string, HoverSnapshot>();
  candles.forEach((candle, i) => {
    byTime.set(candle.time, {
      time: candle.time,
      candle,
      prevClose: i > 0 ? candles[i - 1].close : null,
      sma20: sma20.get(candle.time),
      sma50: sma50.get(candle.time),
      bbUpper: bbUpper.get(candle.time),
      bbLower: bbLower.get(candle.time),
    });
  });
  const lastCandle = candles[candles.length - 1];
  return { byTime, last: lastCandle ? (byTime.get(lastCandle.time) ?? null) : null };
}

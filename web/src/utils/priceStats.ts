import type { CandlePoint } from "./chartData";

export type RangeKey = "1M" | "3M" | "6M" | "1Y" | "ALL";

/** Trading-day bar counts per range (approximate: 21 sessions per month). */
export const RANGE_BARS: Record<RangeKey, number> = {
  "1M": 21,
  "3M": 63,
  "6M": 126,
  "1Y": 252,
  ALL: Number.POSITIVE_INFINITY,
};

export const RANGE_KEYS: RangeKey[] = ["1M", "3M", "6M", "1Y", "ALL"];

export interface HighLow {
  high: number;
  low: number;
}

export interface PriceStats {
  range: HighLow | null;
  rangeChangePct: number | null;
  week52: HighLow | null;
  avgVolume20: number | null;
  barsInRange: number;
}

export function sliceRange(candles: CandlePoint[], range: RangeKey): CandlePoint[] {
  const n = RANGE_BARS[range];
  return Number.isFinite(n) ? candles.slice(-n) : candles;
}

function highLow(candles: CandlePoint[]): HighLow | null {
  if (candles.length === 0) return null;
  let high = Number.NEGATIVE_INFINITY;
  let low = Number.POSITIVE_INFINITY;
  for (const c of candles) {
    if (c.high > high) high = c.high;
    if (c.low < low) low = c.low;
  }
  return { high, low };
}

export function computePriceStats(candles: CandlePoint[], range: RangeKey): PriceStats {
  const inRange = sliceRange(candles, range);
  const first = inRange[0];
  const last = inRange[inRange.length - 1];
  const volumeWindow = candles.slice(-20);
  const avgVolume20 =
    volumeWindow.length > 0 ? volumeWindow.reduce((s, c) => s + c.volume, 0) / volumeWindow.length : null;
  return {
    range: highLow(inRange),
    rangeChangePct: first && last && first.close > 0 ? (last.close - first.close) / first.close : null,
    week52: highLow(candles.slice(-RANGE_BARS["1Y"])),
    avgVolume20,
    barsInRange: inRange.length,
  };
}

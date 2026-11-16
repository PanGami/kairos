import type { CandlePoint, LinePoint } from "./chartData";

/** Simple moving average of the close. The first `period - 1` bars have no value. */
export function sma(candles: CandlePoint[], period: number): LinePoint[] {
  const out: LinePoint[] = [];
  let sum = 0;
  for (let i = 0; i < candles.length; i += 1) {
    sum += candles[i].close;
    if (i >= period) sum -= candles[i - period].close;
    if (i >= period - 1) out.push({ time: candles[i].time, value: sum / period });
  }
  return out;
}

export interface BollingerBands {
  upper: LinePoint[];
  middle: LinePoint[];
  lower: LinePoint[];
}

/** Bollinger Bands: SMA(period) +/- mult * population standard deviation of the close. */
export function bollinger(candles: CandlePoint[], period = 20, mult = 2): BollingerBands {
  const upper: LinePoint[] = [];
  const middle: LinePoint[] = [];
  const lower: LinePoint[] = [];
  for (let i = period - 1; i < candles.length; i += 1) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j += 1) sum += candles[j].close;
    const mean = sum / period;
    let variance = 0;
    for (let j = i - period + 1; j <= i; j += 1) variance += (candles[j].close - mean) ** 2;
    const sd = Math.sqrt(variance / period);
    const time = candles[i].time;
    middle.push({ time, value: mean });
    upper.push({ time, value: mean + mult * sd });
    lower.push({ time, value: mean - mult * sd });
  }
  return { upper, middle, lower };
}

export interface DerivedIndicators {
  sma20: LinePoint[];
  sma50: LinePoint[];
  bollinger: BollingerBands;
}

export function computeIndicators(candles: CandlePoint[]): DerivedIndicators {
  return {
    sma20: sma(candles, 20),
    sma50: sma(candles, 50),
    bollinger: bollinger(candles, 20, 2),
  };
}

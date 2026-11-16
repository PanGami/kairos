import { RANGE_KEYS, type RangeKey } from "./priceStats";

export type ChartType = "candles" | "area" | "line";

export const CHART_TYPES: ChartType[] = ["candles", "area", "line"];

export type IndicatorKey = "volume" | "sma20" | "sma50" | "bollinger" | "cone80" | "cone95" | "backtest";

/** Grouped for the Indicators menu; order here is the order users see. */
export const INDICATOR_GROUPS: Array<{ id: "overlays" | "volume" | "risk"; keys: IndicatorKey[] }> = [
  { id: "overlays", keys: ["sma20", "sma50", "bollinger"] },
  { id: "volume", keys: ["volume"] },
  { id: "risk", keys: ["cone80", "cone95", "backtest"] },
];

export interface ChartPrefs {
  type: ChartType;
  range: RangeKey;
  indicators: Record<IndicatorKey, boolean>;
}

/** KAIROS risk layers and volume are on by default; price overlays are opt-in. */
export const DEFAULT_CHART_PREFS: ChartPrefs = {
  type: "candles",
  range: "6M",
  indicators: {
    volume: true,
    sma20: false,
    sma50: false,
    bollinger: false,
    cone80: true,
    cone95: true,
    backtest: true,
  },
};

const INDICATOR_LIST = Object.keys(DEFAULT_CHART_PREFS.indicators) as IndicatorKey[];

/** Rebuilds prefs from untrusted storage so a stale or edited value can never break the chart. */
export function sanitizePrefs(raw: unknown): ChartPrefs {
  const base = DEFAULT_CHART_PREFS;
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<ChartPrefs> & { indicators?: Record<string, unknown> };
  const indicators = { ...base.indicators };
  for (const key of INDICATOR_LIST) {
    const v = r.indicators?.[key];
    if (typeof v === "boolean") indicators[key] = v;
  }
  return {
    type: CHART_TYPES.includes(r.type as ChartType) ? (r.type as ChartType) : base.type,
    range: RANGE_KEYS.includes(r.range as RangeKey) ? (r.range as RangeKey) : base.range,
    indicators,
  };
}

export function countActiveIndicators(prefs: ChartPrefs): number {
  return INDICATOR_LIST.filter((k) => prefs.indicators[k]).length;
}

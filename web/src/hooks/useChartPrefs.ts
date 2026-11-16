import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_CHART_PREFS,
  sanitizePrefs,
  type ChartPrefs,
  type ChartType,
  type IndicatorKey,
} from "../utils/chartPrefs";
import type { RangeKey } from "../utils/priceStats";

const KEY = "kairos-chart-prefs";

function load(): ChartPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? sanitizePrefs(JSON.parse(raw)) : DEFAULT_CHART_PREFS;
  } catch {
    return DEFAULT_CHART_PREFS;
  }
}

export interface ChartPrefsApi {
  prefs: ChartPrefs;
  setType: (type: ChartType) => void;
  setRange: (range: RangeKey) => void;
  toggleIndicator: (key: IndicatorKey) => void;
  reset: () => void;
}

/** Chart type, range and indicator toggles, persisted in the browser only. */
export function useChartPrefs(): ChartPrefsApi {
  const [prefs, setPrefs] = useState<ChartPrefs>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(prefs));
    } catch {
      /* Storage can be unavailable (private mode); preferences then last for the session only. */
    }
  }, [prefs]);

  const setType = useCallback((type: ChartType) => setPrefs((p) => ({ ...p, type })), []);
  const setRange = useCallback((range: RangeKey) => setPrefs((p) => ({ ...p, range })), []);
  const toggleIndicator = useCallback(
    (key: IndicatorKey) =>
      setPrefs((p) => ({ ...p, indicators: { ...p.indicators, [key]: !p.indicators[key] } })),
    [],
  );
  const reset = useCallback(() => setPrefs(DEFAULT_CHART_PREFS), []);

  return { prefs, setType, setRange, toggleIndicator, reset };
}

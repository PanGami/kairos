import { useLocale } from "../../hooks/useLocale";
import type { ChartPrefsApi } from "../../hooks/useChartPrefs";
import { CHART_TYPES } from "../../utils/chartPrefs";
import { RANGE_KEYS } from "../../utils/priceStats";
import { IndicatorMenu } from "./IndicatorMenu";

interface Props {
  instrumentId?: string;
  chartPrefs: ChartPrefsApi;
  onOpenSearch: () => void;
}

export function ChartToolbar({ instrumentId, chartPrefs, onOpenSearch }: Props) {
  const { t } = useLocale();
  const c = t.chartUi;
  const { prefs, setRange, setType, toggleIndicator, reset } = chartPrefs;

  return (
    <div className="chart-toolbar" role="group" aria-label={c.toolbarAriaLabel}>
      <button
        type="button"
        className="chart-symbol-btn"
        aria-haspopup="dialog"
        aria-label={c.symbolButtonAriaLabel(instrumentId ?? "")}
        onClick={onOpenSearch}
      >
        <span className="chart-symbol-hint">{c.symbolSearchLabel}</span>
        <strong className="chart-symbol-id">{instrumentId ?? "TICKER"}</strong>
      </button>

      <span className="chart-interval-tag" title={c.intervalHint}>
        {c.intervalTag}
      </span>

      <div className="chart-tool-group" role="group" aria-label={c.rangeGroupAriaLabel}>
        {RANGE_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            className={`chart-tool-btn${prefs.range === key ? " active" : ""}`}
            aria-pressed={prefs.range === key}
            aria-label={c.ranges[key].aria}
            onClick={() => setRange(key)}
          >
            {c.ranges[key].label}
          </button>
        ))}
      </div>

      <div className="chart-tool-group" role="group" aria-label={c.typeGroupAriaLabel}>
        {CHART_TYPES.map((key) => (
          <button
            key={key}
            type="button"
            className={`chart-tool-btn${prefs.type === key ? " active" : ""}`}
            aria-pressed={prefs.type === key}
            onClick={() => setType(key)}
          >
            {c.types[key]}
          </button>
        ))}
      </div>

      <IndicatorMenu prefs={prefs} onToggle={toggleIndicator} onReset={reset} />
    </div>
  );
}

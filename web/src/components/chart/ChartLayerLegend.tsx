import { useLocale } from "../../hooks/useLocale";
import type { ChartPrefs, IndicatorKey } from "../../utils/chartPrefs";

const SWATCH: Record<IndicatorKey, string> = {
  sma20: "indicator-swatch-sma20",
  sma50: "indicator-swatch-sma50",
  bollinger: "indicator-swatch-bollinger",
  volume: "indicator-swatch-volume",
  cone80: "swatch-80",
  cone95: "swatch-95",
  backtest: "swatch-backtest",
};

const ORDER: IndicatorKey[] = ["sma20", "sma50", "bollinger", "volume", "cone80", "cone95", "backtest"];

/** Chips for the layers that are currently drawn, so the legend always matches the canvas. */
export function ChartLayerLegend({ prefs }: { prefs: ChartPrefs }) {
  const { t } = useLocale();
  const l = t.chartUi.legend;
  const coneVisible = prefs.indicators.cone80 || prefs.indicators.cone95;

  return (
    <div className="chart-legend chart-layer-legend" role="group" aria-label={l.ariaLabel}>
      {ORDER.flatMap((key) => {
        if (!prefs.indicators[key]) return [];
        const chip = (
          <span key={key} className="legend-item">
            <span className={`legend-swatch ${SWATCH[key]}`} aria-hidden="true" />
            {l.items[key]}
          </span>
        );
        if (key === "cone80" && coneVisible) {
          return [
            <span key="median" className="legend-item">
              <span className="legend-swatch swatch-forecast" aria-hidden="true" />
              {l.median}
            </span>,
            chip,
          ];
        }
        return [chip];
      })}
      {!prefs.indicators.cone80 && prefs.indicators.cone95 && (
        <span className="legend-item">
          <span className="legend-swatch swatch-forecast" aria-hidden="true" />
          {l.median}
        </span>
      )}
    </div>
  );
}

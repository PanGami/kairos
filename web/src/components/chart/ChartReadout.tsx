import { useLocale } from "../../hooks/useLocale";
import type { ChartPrefs } from "../../utils/chartPrefs";
import { formatPrice, formatSignedPct, formatSignedPrice, formatVolume } from "../../utils/format";
import { AnimatedValue } from "../AnimatedValue";
import type { HoverSnapshot } from "./chartLookup";

interface Props {
  instrumentId?: string;
  mic?: string;
  snapshot: HoverSnapshot | null;
  prefs: ChartPrefs;
}

/** TradingView style readout: ticker, interval, OHLC, change, volume, then active indicator values. */
export function ChartReadout({ instrumentId, mic, snapshot, prefs }: Props) {
  const { t } = useLocale();
  const o = t.chartUi.ohlc;
  const legend = t.chartUi.legend.items;

  if (!snapshot) {
    return <div className="chart-readout" aria-label={o.ariaLabel} />;
  }

  const { candle, prevClose } = snapshot;
  const tone = candle.close >= candle.open ? "tone-up" : "tone-down";
  const change = prevClose && prevClose > 0 ? candle.close - prevClose : null;
  const changePct = prevClose && prevClose > 0 && change !== null ? change / prevClose : null;
  const changeTone = change !== null && change < 0 ? "tone-down" : "tone-up";

  const cell = (key: string, title: string, value: number) => (
    <span className="readout-item" title={title}>
      <span className="readout-key">{key}</span>
      <span className={`readout-value ${tone}`}>
        <AnimatedValue value={value} format={formatPrice} durationMs={120} />
      </span>
    </span>
  );

  const indicatorValues: Array<{ key: string; label: string; value: number }> = [];
  if (prefs.indicators.sma20 && snapshot.sma20 !== undefined) {
    indicatorValues.push({ key: "sma20", label: legend.sma20, value: snapshot.sma20 });
  }
  if (prefs.indicators.sma50 && snapshot.sma50 !== undefined) {
    indicatorValues.push({ key: "sma50", label: legend.sma50, value: snapshot.sma50 });
  }
  if (prefs.indicators.bollinger && snapshot.bbUpper !== undefined && snapshot.bbLower !== undefined) {
    indicatorValues.push({ key: "bbu", label: `${legend.bollinger} UP`, value: snapshot.bbUpper });
    indicatorValues.push({ key: "bbl", label: `${legend.bollinger} LOW`, value: snapshot.bbLower });
  }

  return (
    <div className="chart-readout" role="group" aria-label={o.ariaLabel}>
      <div className="readout-line">
        {instrumentId && <strong className="readout-ticker">{instrumentId}</strong>}
        <span className="readout-meta">{t.chartUi.intervalTag}</span>
        {mic && <span className="readout-meta">{mic}</span>}
        <span className="readout-meta">{snapshot.time}</span>
        {cell(o.open, o.openTitle, candle.open)}
        {cell(o.high, o.highTitle, candle.high)}
        {cell(o.low, o.lowTitle, candle.low)}
        {cell(o.close, o.closeTitle, candle.close)}
        {change !== null && changePct !== null && (
          <span className={`readout-change ${changeTone}`}>
            <AnimatedValue value={change} format={formatSignedPrice} durationMs={120} /> (
            <AnimatedValue value={changePct} format={formatSignedPct} durationMs={120} />)
          </span>
        )}
        <span className="readout-item" title={o.volumeTitle}>
          <span className="readout-key">{o.volume}</span>
          <span className={`readout-value ${tone}`}>
            <AnimatedValue value={candle.volume} format={formatVolume} durationMs={120} />
          </span>
        </span>
      </div>

      {indicatorValues.length > 0 && (
        <div className="readout-line readout-indicators">
          {indicatorValues.map((v) => (
            <span key={v.key} className="readout-item">
              <span className={`indicator-swatch indicator-swatch-${v.key.startsWith("bb") ? "bollinger" : v.key}`} aria-hidden="true" />
              <span className="readout-key">{v.label}</span>
              <span className="readout-value">
                <AnimatedValue value={v.value} format={formatPrice} durationMs={120} />
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

import { useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { EditorialIntro } from "../components/EditorialIntro";
import { ForecastSummary } from "../components/ForecastSummary";
import { HorizonToggle } from "../components/HorizonToggle";
import { InstrumentSelect } from "../components/InstrumentSelect";
import { PriceChart } from "../components/PriceChart";
import { ReliabilityBadge } from "../components/ReliabilityBadge";
import { TeaserPreviewRow } from "../components/TeaserPreviewRow";
import { useAuth } from "../hooks/useAuth";
import { useForecast, useHistory } from "../hooks/useForecast";
import { useInstruments } from "../hooks/useInstruments";
import type { Theme } from "../hooks/useTheme";
import type { Horizon, Instrument } from "../types/api.types";
import { buildChartSeries } from "../utils/chartData";

export function DashboardPage() {
  const { theme } = useOutletContext<{ theme: Theme }>();
  const { user } = useAuth();
  const isGuest = !user;

  const instruments = useInstruments();
  const [selected, setSelected] = useState<string | null>(null);
  const [horizon, setHorizon] = useState<Horizon>(7);
  const [lockedPrompt, setLockedPrompt] = useState<Instrument | null>(null);

  const featuredInstrument = useMemo(() => {
    const list = instruments.data ?? [];
    return (
      list.find((i) => i.instrument_id === "IDX:TLKM") ??
      list.find((i) => i.reliability_tier === "full") ??
      list[0] ??
      null
    );
  }, [instruments.data]);

  const featuredId = featuredInstrument?.instrument_id ?? null;
  const activeId = isGuest ? featuredId : (selected ?? featuredId);
  const activeInstrument =
    instruments.data?.find((i) => i.instrument_id === activeId) ?? featuredInstrument;

  const lockedInstruments = useMemo(
    () => (instruments.data ?? []).filter((i) => i.instrument_id !== featuredId),
    [instruments.data, featuredId],
  );

  const forecast = useForecast(activeId, horizon);
  const history = useHistory(activeId);

  const series = useMemo(
    () => (forecast.data && history.data ? buildChartSeries(history.data, forecast.data, horizon) : null),
    [forecast.data, history.data, horizon],
  );

  const isInsufficient = forecast.data?.reliability_tier === "insufficient";
  const isDegradedOrLow =
    !isInsufficient &&
    (forecast.data?.status === "degraded" || forecast.data?.reliability_tier === "low");

  return (
    <div>
      <EditorialIntro isGuest={isGuest} />

      {instruments.loading ? (
        <p className="muted">Loading instruments...</p>
      ) : instruments.error ? (
        <div className="banner banner-error">Failed to load instruments: {instruments.error}</div>
      ) : !instruments.data || instruments.data.length === 0 ? (
        <div className="banner banner-info">No active instruments configured.</div>
      ) : (
        <section aria-label="Core risk workspace">
          <div className="workspace-header">
            <InstrumentSelect
              instruments={instruments.data}
              value={activeId}
              featuredId={featuredId}
              isGuest={isGuest}
              onChange={(nextId) => {
                setLockedPrompt(null);
                setSelected(nextId);
              }}
              onLockedClick={(inst) => setLockedPrompt(inst)}
            />
            <HorizonToggle value={horizon} onChange={setHorizon} />
          </div>

          {isGuest && lockedPrompt && (
            <div className="locked-prompt" role="region" aria-label="Sign in prompt for locked emitter">
              <div className="locked-prompt-copy">
                <div className="locked-prompt-title">
                  {lockedPrompt.instrument_id} ({lockedPrompt.mic}) requires a verified session
                </div>
                <div className="locked-prompt-text">
                  Guest access showcases {featuredId} as today&apos;s featured emitter. Sign in free with Google to unlock full access across all calibrated emitters.
                </div>
              </div>
              <div className="locked-prompt-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setLockedPrompt(null)}>
                  Dismiss
                </button>
                <Link to="/login" className="btn btn-primary">
                  Unlock Full Access
                </Link>
              </div>
            </div>
          )}

          {(forecast.error || history.error) && (
            <div className="banner banner-error">
              Failed to load market data: {forecast.error ?? history.error}
            </div>
          )}

          {isInsufficient && (
            <div className="banner banner-error" role="alert">
              Insufficient history for this instrument: statistical forecast is unavailable.
            </div>
          )}

          {isDegradedOrLow && forecast.data && (
            <div className="banner banner-warning" role="status">
              {forecast.data.reliability_tier === "low"
                ? "Low reliability and thin liquidity: volatility uses long-run fallback variance. Interpret intervals with caution."
                : "Degraded run status: model fell back to constant or EWMA variance for this horizon."}
            </div>
          )}

          {forecast.data && (
            <ReliabilityBadge
              tier={forecast.data.reliability_tier}
              status={forecast.data.status}
              asOfDate={forecast.data.as_of_date}
              mic={activeInstrument?.mic}
            />
          )}

          {forecast.data && (
            <ForecastSummary f={forecast.data} currency={activeInstrument?.currency} />
          )}

          {forecast.loading || history.loading ? (
            <div className="banner banner-info">Loading forecast envelope and backtest history...</div>
          ) : series ? (
            <PriceChart series={series} theme={theme} instrumentId={activeId ?? undefined} />
          ) : null}

          {forecast.data && (
            <div className="footer-provenance" aria-label="Instrument snapshot provenance">
              <span className="provenance-item">DATA AS OF {forecast.data.as_of_date}</span>
              <span className="provenance-item">
                LAST SUCCESSFUL UPDATE {new Date(forecast.data.last_successful_update).toLocaleString()}
              </span>
              <span className="provenance-item">HORIZON {forecast.data.horizon_days}D</span>
            </div>
          )}

          {isGuest && <TeaserPreviewRow lockedInstruments={lockedInstruments} />}
        </section>
      )}
    </div>
  );
}

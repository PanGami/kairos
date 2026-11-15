import { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext, useSearchParams } from "react-router-dom";
import { EditorialIntro } from "../components/EditorialIntro";
import { ForecastSummary } from "../components/ForecastSummary";
import { HorizonToggle } from "../components/HorizonToggle";
import { InstrumentSelect } from "../components/InstrumentSelect";
import { PriceChart } from "../components/PriceChart";
import { ReliabilityBadge } from "../components/ReliabilityBadge";
import { useAuth } from "../hooks/useAuth";
import { useForecast, useHistory } from "../hooks/useForecast";
import { useInstruments } from "../hooks/useInstruments";
import { useLocale } from "../hooks/useLocale";
import type { Theme } from "../hooks/useTheme";
import type { Horizon, Instrument } from "../types/api.types";
import { buildChartSeries } from "../utils/chartData";

function formatUtcTimestamp(raw: string): string {
  const parsed = Date.parse(raw);
  if (Number.isNaN(parsed)) return raw;
  return `${new Date(parsed).toISOString().replace("T", " ").slice(0, 16)} UTC`;
}

export function WatcherPage() {
  const { theme } = useOutletContext<{ theme: Theme }>();
  const { user } = useAuth();
  const { t } = useLocale();
  const w = t.watcher;
  const isGuest = !user;
  const [searchParams, setSearchParams] = useSearchParams();

  const instruments = useInstruments();
  const [selected, setSelected] = useState<string | null>(() => searchParams.get("ticker"));
  const [horizon, setHorizon] = useState<Horizon>(() => (searchParams.get("horizon") === "30" ? 30 : 7));
  const [lockedPrompt, setLockedPrompt] = useState<Instrument | null>(null);

  const paramTicker = searchParams.get("ticker");
  const paramHorizon = searchParams.get("horizon");

  useEffect(() => {
    if (paramHorizon === "30") {
      setHorizon(30);
    } else if (paramHorizon === "7") {
      setHorizon(7);
    }
    if (paramTicker) {
      setSelected(paramTicker);
    }
  }, [paramTicker, paramHorizon]);

  useEffect(() => {
    if (!lockedPrompt) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLockedPrompt(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lockedPrompt]);

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

  useEffect(() => {
    if (!isGuest || !paramTicker || !featuredId || paramTicker === featuredId) return;
    const lockedInst = instruments.data?.find((i) => i.instrument_id === paramTicker);
    if (lockedInst) {
      setLockedPrompt(lockedInst);
    }
  }, [isGuest, paramTicker, featuredId, instruments.data]);

  const validSelected = useMemo(
    () => (instruments.data?.some((i) => i.instrument_id === selected) ? selected : null),
    [instruments.data, selected],
  );
  const activeId = isGuest ? featuredId : (validSelected ?? featuredId);
  const activeInstrument =
    instruments.data?.find((i) => i.instrument_id === activeId) ?? featuredInstrument;

  const lockedTickerNames = useMemo(
    () =>
      (instruments.data ?? [])
        .filter((i) => i.instrument_id !== featuredId)
        .map((i) => i.instrument_id)
        .join(", "),
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

  function handleSelectInstrument(nextId: string) {
    setLockedPrompt(null);
    setSelected(nextId);
    setSearchParams({ ticker: nextId, horizon: String(horizon) }, { replace: true });
  }

  function handleChangeHorizon(nextHorizon: Horizon) {
    setHorizon(nextHorizon);
    const nextParams: Record<string, string> = { horizon: String(nextHorizon) };
    if (activeId) {
      nextParams.ticker = activeId;
    }
    setSearchParams(nextParams, { replace: true });
  }

  return (
    <div>
      {instruments.loading ? (
        <>
          <div className="banner banner-info" role="status">
            {w.loadingInstruments}
          </div>
          <EditorialIntro isGuest={isGuest} />
        </>
      ) : instruments.error ? (
        <>
          <div className="banner banner-error" role="alert">
            <div>{w.loadError(instruments.error)}</div>
            <div className="banner-actions">
              <button type="button" className="btn btn-ghost" onClick={() => window.location.reload()}>
                {w.reloadPage}
              </button>
            </div>
          </div>
          <EditorialIntro isGuest={isGuest} />
        </>
      ) : !instruments.data || instruments.data.length === 0 ? (
        <>
          <div className="banner banner-info">{w.emptyInstruments}</div>
          <EditorialIntro isGuest={isGuest} />
        </>
      ) : (
        <section className="terminal-grid" aria-label={w.workspaceAriaLabel}>
          <aside className="terminal-col-left" aria-label={w.watchlistAriaLabel}>
            <InstrumentSelect
              instruments={instruments.data}
              value={activeId}
              featuredId={featuredId}
              isGuest={isGuest}
              activeLastPrice={forecast.data?.last_price}
              currency={activeInstrument?.currency}
              onChange={handleSelectInstrument}
              onLockedClick={(inst) => setLockedPrompt(inst)}
            />
          </aside>

          <div className="terminal-col-center">
            <div className="terminal-quote-bar">
              <ReliabilityBadge
                instrumentId={activeId ?? undefined}
                lastPrice={forecast.data?.last_price}
                currency={activeInstrument?.currency}
                tier={forecast.data?.reliability_tier ?? activeInstrument?.reliability_tier ?? "full"}
                status={forecast.data?.status}
                asOfDate={forecast.data?.as_of_date}
                mic={activeInstrument?.mic}
              />
              <HorizonToggle value={horizon} onChange={handleChangeHorizon} />
            </div>

            {isGuest && lockedPrompt && (
              <div
                className="locked-prompt"
                role="dialog"
                aria-modal="false"
                aria-label={w.lockedDialogAriaLabel(lockedPrompt.instrument_id)}
              >
                <div className="locked-prompt-copy">
                  <div className="locked-prompt-title">
                    {w.lockedTitle(lockedPrompt.instrument_id, lockedPrompt.mic)}
                  </div>
                  <div className="locked-prompt-text">
                    {w.lockedBody(
                      featuredId ?? "IDX:TLKM",
                      lockedTickerNames || lockedPrompt.instrument_id,
                    )}
                  </div>
                </div>
                <div className="locked-prompt-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => setLockedPrompt(null)}>
                    {w.dismiss}
                  </button>
                  <Link to="/login" className="btn btn-primary">
                    {w.signInAllTickers}
                  </Link>
                </div>
              </div>
            )}

            {(forecast.error || history.error) && (
              <div className="banner banner-error" role="alert">
                {w.marketDataError(activeId ?? "", forecast.error ?? history.error ?? "")}
              </div>
            )}

            {isInsufficient && (
              <div className="banner banner-error" role="alert">
                {w.insufficientHistory}
              </div>
            )}

            {isDegradedOrLow && forecast.data && (
              <div className="banner banner-warning" role="status">
                {forecast.data.reliability_tier === "low" ? w.lowReliabilityWarning : w.degradedWarning}
              </div>
            )}

            {series ? (
              <PriceChart
                series={series}
                theme={theme}
                instrumentId={activeId ?? undefined}
                horizonDays={horizon}
                loading={forecast.loading || history.loading}
              />
            ) : forecast.loading || history.loading ? (
              <section className="chart-panel" aria-label={w.loadingChartAriaLabel}>
                <div className="chart-header">
                  <div className="chart-title-row">
                    <h1 className="chart-title">{w.loadingChartTitle(horizon, activeId ?? "")}</h1>
                  </div>
                </div>
                <div className="chart-canvas chart-skeleton" role="status" aria-label={w.loadingChartCanvasAriaLabel} />
              </section>
            ) : null}

            {forecast.data && (
              <div className="snapshot-provenance" aria-label={w.provenanceAriaLabel}>
                <span className="provenance-item">{w.dataAsOf(forecast.data.as_of_date)}</span>
                <span className="provenance-item">
                  {w.lastSuccessfulUpdate(formatUtcTimestamp(forecast.data.last_successful_update))}
                </span>
                <span className="provenance-item">{w.horizonTag(forecast.data.horizon_days)}</span>
              </div>
            )}
          </div>

          <aside className="terminal-col-right" aria-label={w.statsAriaLabel}>
            {forecast.data && (
              <ForecastSummary f={forecast.data} currency={activeInstrument?.currency} />
            )}
            <EditorialIntro isGuest={isGuest} />
          </aside>
        </section>
      )}
    </div>
  );
}

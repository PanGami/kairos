import { useOutletContext } from "react-router-dom";
import { ForecastSummary } from "../components/ForecastSummary";
import { HorizonToggle } from "../components/HorizonToggle";
import { InstrumentSelect } from "../components/InstrumentSelect";
import { PriceChart } from "../components/PriceChart";
import { ReliabilityBadge } from "../components/ReliabilityBadge";
import { useForecast, useHistory } from "../hooks/useForecast";
import { useInstruments } from "../hooks/useInstruments";
import type { Theme } from "../hooks/useTheme";
import { useMemo, useState } from "react";
import type { Horizon } from "../types/api.types";
import { buildChartSeries } from "../utils/chartData";

export function DashboardPage() {
  const { theme } = useOutletContext<{ theme: Theme }>();
  const instruments = useInstruments();
  const [selected, setSelected] = useState<string | null>(null);
  const [horizon, setHorizon] = useState<Horizon>(7);

  const id = selected ?? instruments.data?.[0]?.instrument_id ?? null;
  const forecast = useForecast(id, horizon);
  const history = useHistory(id);

  const series = useMemo(
    () => (forecast.data && history.data ? buildChartSeries(history.data, forecast.data, horizon) : null),
    [forecast.data, history.data, horizon],
  );

  if (instruments.error) return <p className="error">Failed to load instruments: {instruments.error}</p>;

  return (
    <section>
      <div className="controls">
        <InstrumentSelect instruments={instruments.data ?? []} value={id} onChange={setSelected} />
        <HorizonToggle value={horizon} onChange={setHorizon} />
      </div>

      {(forecast.error || history.error) && <p className="error">{forecast.error ?? history.error}</p>}
      {forecast.data && <ReliabilityBadge tier={forecast.data.reliability_tier} status={forecast.data.status} />}
      {forecast.data && <ForecastSummary f={forecast.data} />}
      {series ? <PriceChart series={series} theme={theme} /> : <p className="muted">Loading…</p>}
      {forecast.data && (
        <p className="muted">
          Last successful update: {new Date(forecast.data.last_successful_update).toLocaleString()}
        </p>
      )}
    </section>
  );
}

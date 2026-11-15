import type { Forecast } from "../types/api.types";
import { formatPct, formatPrice } from "../utils/format";

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {hint && <div className="stat-hint">{hint}</div>}
    </div>
  );
}

export function ForecastSummary({ f }: { f: Forecast }) {
  return (
    <div className="stats">
      <Stat label={`Last close (${f.as_of_date})`} value={formatPrice(f.last_price)} />
      <Stat
        label={`${f.horizon_days}d range (80%)`}
        value={`${formatPrice(f.lower80)} – ${formatPrice(f.upper80)}`}
        hint={`95%: ${formatPrice(f.lower95)} – ${formatPrice(f.upper95)}`}
      />
      <Stat
        label="Annualized volatility"
        value={formatPct(f.volatility.annualized)}
        hint={`Daily ${formatPct(f.volatility.daily, 2)}`}
      />
      <Stat
        label={`Drawdown ≥ ${formatPct(f.correction.theta, 0)} probability`}
        value={formatPct(f.correction.probability)}
        hint={`Rolling base rate ${formatPct(f.correction.rolling_base_rate)}`}
      />
    </div>
  );
}

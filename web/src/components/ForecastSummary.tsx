import type { Forecast } from "../types/api.types";
import { formatPct, formatPrice } from "../utils/format";

interface StatProps {
  label: string;
  value: string;
  hints?: string[];
}

function Stat({ label, value, hints }: StatProps) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div>
        <div className="stat-value">{value}</div>
        {hints && hints.length > 0 && (
          <div className="stat-hint">
            {hints.map((line) => (
              <div key={line}>{line}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ForecastSummary({ f, currency = "IDR" }: { f: Forecast; currency?: string }) {
  return (
    <div className="stats-grid">
      <Stat
        label="LAST CLOSE (EOD)"
        value={`${formatPrice(f.last_price)} ${currency}`}
        hints={[`AS OF ${f.as_of_date}`]}
      />
      <Stat
        label="UNCERTAINTY RANGE (80%)"
        value={`${formatPrice(f.lower80)} TO ${formatPrice(f.upper80)} ${currency}`}
        hints={[
          `${f.horizon_days}D HORIZON`,
          `95% INTERVAL ${formatPrice(f.lower95)} TO ${formatPrice(f.upper95)} ${currency}`,
        ]}
      />
      <Stat
        label="ANNUALIZED VOLATILITY"
        value={formatPct(f.volatility.annualized)}
        hints={[
          `DAILY ${formatPct(f.volatility.daily, 2)}`,
          `BAND ${formatPct(f.volatility.lower)} TO ${formatPct(f.volatility.upper)}`,
        ]}
      />
      <Stat
        label="CORRECTION PROBABILITY"
        value={formatPct(f.correction.probability)}
        hints={[
          `THRESHOLD THETA ${formatPct(f.correction.theta, 1)}`,
          `252D ROLLING BASE RATE ${formatPct(f.correction.rolling_base_rate)}`,
        ]}
      />
    </div>
  );
}

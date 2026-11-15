import { Link } from "react-router-dom";
import type { Instrument } from "../types/api.types";

interface Props {
  lockedInstruments: Instrument[];
}

export function TeaserPreviewRow({ lockedInstruments }: Props) {
  if (lockedInstruments.length === 0) return null;

  return (
    <section className="teaser-section" aria-label="Locked emitter coverage preview">
      <div className="teaser-header">
        <div>
          <h2 className="teaser-title">Additional Calibrated Coverage</h2>
          <p className="teaser-subtitle">
            Sign in for free full-universe access to conditional volatility, walk-forward curves, and drawdown bands.
          </p>
        </div>
        <Link to="/login" className="btn btn-primary">
          Sign In to Unlock All Emitters
        </Link>
      </div>

      <div className="teaser-grid">
        {lockedInstruments.map((inst) => (
          <article key={inst.instrument_id} className="teaser-card">
            <div className="teaser-card-head">
              <div>
                <div className="emitter-ticker">{inst.instrument_id}</div>
                <div className="emitter-mic">
                  EXCHANGE {inst.mic} {inst.currency}
                </div>
              </div>
              <span className="pill pill-muted">LOCKED</span>
            </div>

            <div className="teaser-metrics">
              <div>
                <div className="stat-label">ANNUALIZED VOLATILITY</div>
                <div className="redacted-value">REDACTED IN GUEST MODE</div>
              </div>
              <div>
                <div className="stat-label">CORRECTION PROBABILITY</div>
                <div className="redacted-value">REDACTED IN GUEST MODE</div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

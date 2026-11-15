import { useState } from "react";

interface Props {
  isGuest: boolean;
}

const PILLARS = [
  {
    tag: "MODEL M1",
    title: "Empirical Price Range",
    desc: "Random walk midpoint surrounded by calibrated 80% and 95% trailing return intervals.",
  },
  {
    tag: "MODEL M2",
    title: "GARCH-t Volatility",
    desc: "Time-varying conditional volatility modeling fat-tailed equity shocks with automated constant-variance fallback.",
  },
  {
    tag: "MODEL M3",
    title: "Correction Probability",
    desc: "Volatility-implied drawdown probability benchmarked against the trailing 252-day rolling base rate.",
  },
];

export function EditorialIntro({ isGuest }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (!isGuest && !expanded) {
    return (
      <section className="workspace-bar" aria-label="Authenticated workspace summary">
        <div className="workspace-bar-meta">
          <span className="pill pill-cyan">AUTHENTICATED WORKSPACE</span>
          <span className="pill pill-verified">
            <span className="geo-dot" aria-hidden="true" />
            VERIFIED
          </span>
          <span className="workspace-bar-text">
            All calibrated emitters and forecast horizons are unlocked for end-of-day risk inspection.
          </span>
        </div>
        <button type="button" className="btn btn-ghost" onClick={() => setExpanded(true)}>
          About KAIROS
        </button>
      </section>
    );
  }

  return (
    <section className="editorial-intro" aria-label="KAIROS methodology overview">
      <div className="editorial-kicker">
        <span className="pill pill-cyan">EOD QUANTITATIVE UNCERTAINTY</span>
        <span className="pill pill-muted">NIGHTLY BATCH CALIBRATION</span>
        {!isGuest && (
          <button type="button" className="btn btn-ghost" onClick={() => setExpanded(false)}>
            Collapse Overview
          </button>
        )}
      </div>

      <h1 className="editorial-headline">
        Calibrated End-of-Day Equity Uncertainty &amp; Tail-Risk Monitor.
      </h1>
      <p className="editorial-copy">
        KAIROS computes nightly post-close uncertainty ranges, conditional volatility estimates, and correction
        probabilities rather than directional price predictions or trading signals.
      </p>

      <div className="pillar-grid">
        {PILLARS.map((pillar) => (
          <article key={pillar.tag} className="pillar-card">
            <div className="pillar-tag">{pillar.tag}</div>
            <h2 className="pillar-title">{pillar.title}</h2>
            <p className="pillar-desc">{pillar.desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

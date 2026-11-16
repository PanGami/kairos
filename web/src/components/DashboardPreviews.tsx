import { Link } from "react-router-dom";
import { useLocale } from "../hooks/useLocale";
import type { DashboardFeatureKey } from "../i18n/messages";

export function HeroWatcherPreview() {
  const { t } = useLocale();
  const p = t.dashboard.heroPreview;

  return (
    <aside className="hero-device-frame" aria-label={p.ariaLabel}>
      <div className="device-topbar">
        <span className="device-topbar-title">{p.headerTag}</span>
        <span className="pill pill-muted">{p.sampleTag}</span>
      </div>

      <div className="device-body">
        <div className="device-identity">
          <div className="device-ticker-row">
            <span className="device-ticker">{p.ticker}</span>
            <span className="emitter-mic">{p.mic}</span>
          </div>
          <div className="device-badge-row">
            <span className="pill pill-verified">{p.tier}</span>
            <span className="pill pill-cyan">{p.featured}</span>
          </div>
        </div>

        <div className="device-mini-chart" role="img" aria-label={p.ariaLabel}>
          <svg viewBox="0 0 320 130" width="320" height="130" className="preview-svg" aria-hidden="true">
            <line x1="0" y1="32" x2="320" y2="32" className="svg-grid-line" />
            <line x1="0" y1="65" x2="320" y2="65" className="svg-grid-line" />
            <line x1="0" y1="98" x2="320" y2="98" className="svg-grid-line" />

            <polygon
              points="196,64 312,24 312,106 196,64"
              className="svg-cone-95-fill"
            />
            <polygon
              points="196,64 312,40 312,88 196,64"
              className="svg-cone-80-fill"
            />

            <polyline
              points="12,84 44,76 74,80 106,68 136,72 168,59 196,64"
              className="svg-actual-line"
            />
            <polyline
              points="44,79 74,77 106,72 136,70 168,64 196,65"
              className="svg-backtest-line"
            />

            <line x1="196" y1="64" x2="312" y2="64" className="svg-median-line" />
            <line x1="196" y1="64" x2="312" y2="40" className="svg-band80-line" />
            <line x1="196" y1="64" x2="312" y2="88" className="svg-band80-line" />
            <line x1="196" y1="64" x2="312" y2="24" className="svg-band95-line" />
            <line x1="196" y1="64" x2="312" y2="106" className="svg-band95-line" />
          </svg>
        </div>

        <div className="device-cone-readout">
          <div className="readout-primary-label">{p.range80Label}</div>
          <div className="device-cone-value">{p.range80SampleValue}</div>
          <p className="device-cone-note">{p.sampleNote}</p>
        </div>

        <div className="device-watchlist">
          <div className="device-watchlist-title">{p.watchlistTitle}</div>
          <div className="device-watchlist-rows">
            {p.watchlistRows.map((row) => (
              <Link
                key={row.ticker}
                to={`/watcher?ticker=${encodeURIComponent(row.ticker)}`}
                className="device-watchlist-row"
              >
                <span className="device-row-ticker">{row.ticker}</span>
                <span className={`pill ${row.tone === "verified" ? "pill-verified" : "pill-warning"}`}>
                  {row.tier}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <Link to="/watcher" className="btn btn-secondary device-cta">
          {p.ctaLink}
        </Link>
      </div>
    </aside>
  );
}

export function WorryHorizonVisual() {
  const { t } = useLocale();
  const v = t.dashboard.worryVisual;

  return (
    <div className="worry-visual-card">
      <div className="worry-visual-header">
        <span className="pill pill-cyan">{v.badge}</span>
      </div>

      <div className="worry-cone-diagram" aria-hidden="true">
        <svg viewBox="0 0 360 150" width="360" height="150" className="preview-svg">
          <line x1="20" y1="75" x2="340" y2="75" className="svg-grid-line" />
          <line x1="130" y1="16" x2="130" y2="134" className="svg-grid-line" />

          <polyline points="20,92 58,84 94,88 130,75" className="svg-actual-line" />

          <polygon points="130,75 215,48 215,102" className="svg-cone-80-fill" />
          <polygon points="130,75 340,22 340,128" className="svg-cone-95-fill" />

          <line x1="130" y1="75" x2="340" y2="75" className="svg-median-line" />
          <line x1="130" y1="75" x2="340" y2="38" className="svg-band80-line" />
          <line x1="130" y1="75" x2="340" y2="112" className="svg-band80-line" />
          <line x1="130" y1="75" x2="340" y2="22" className="svg-band95-line" />
          <line x1="130" y1="75" x2="340" y2="128" className="svg-band95-line" />
        </svg>
      </div>

      <div className="worry-horizon-grid">
        <div className="worry-horizon-box">
          <span className="worry-horizon-code">{v.horizon7Label}</span>
          <span className="worry-horizon-desc">{v.horizon7Desc}</span>
        </div>
        <div className="worry-horizon-box">
          <span className="worry-horizon-code">{v.horizon30Label}</span>
          <span className="worry-horizon-desc">{v.horizon30Desc}</span>
        </div>
      </div>

      <div className="worry-visual-meta">
        <span>{v.windowLabel}</span>
        <span>{v.auditLabel}</span>
      </div>
    </div>
  );
}

export function SmartWarningShowcase() {
  const { t } = useLocale();
  const d = t.dashboard;

  return (
    <div className="warning-showcase" aria-label={d.warningShowcaseAriaLabel}>
      <div className="warning-showcase-bar">
        <span className="widget-title">{d.warningShowcaseHeader}</span>
        <span className="widget-meta">M1 / M2 / M3</span>
      </div>
      <div className="warning-cards-stack">
        {d.warningCards.map((card) => (
          <Link
            key={card.ticker}
            to={`/watcher?ticker=${encodeURIComponent(card.ticker)}`}
            className="warning-alert-card"
          >
            <div className="warning-card-head">
              <span className="warning-card-ticker">{card.ticker}</span>
              <span className={`pill ${card.tone === "verified" ? "pill-verified" : "pill-warning"}`}>
                {card.status}
              </span>
            </div>
            <div className="warning-card-title">{card.title}</div>
            <p className="warning-card-detail">{card.detail}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function KeyFeatureChartPreview({ activeFeature }: { activeFeature: DashboardFeatureKey }) {
  const { t } = useLocale();
  const d = t.dashboard;
  const active = d.features.find((item) => item.id === activeFeature) ?? d.features[0];
  const legend = d.featuresChartLegend;

  const emphasizeCone = active.id === "m1";
  const emphasizeVol = active.id === "m2";
  const emphasizeTail = active.id === "m3";
  const emphasizeBacktest = active.id === "backtest";

  return (
    <div className="features-preview-frame" aria-label={d.featuresPreviewAriaLabel}>
      <div className="widget-header">
        <div className="features-preview-identity">
          <span className="widget-title">IDX:TLKM</span>
          <span className="pill pill-cyan">{active.previewTag}</span>
        </div>
        <span className="widget-meta">{d.featuresPreviewSampleBadge}</span>
      </div>

      <div className="features-chart-body">
        <div className="chart-legend features-legend">
          <span className="legend-item">
            <span className="legend-swatch swatch-actual" aria-hidden="true" />
            {legend.actual}
          </span>
          <span className="legend-item">
            <span className="legend-swatch swatch-backtest" aria-hidden="true" />
            {legend.backtest}
          </span>
          <span className="legend-item">
            <span className="legend-swatch swatch-forecast" aria-hidden="true" />
            {legend.median}
          </span>
          <span className="legend-item">
            <span className="legend-swatch swatch-80" aria-hidden="true" />
            {legend.band80}
          </span>
          <span className="legend-item">
            <span className="legend-swatch swatch-95" aria-hidden="true" />
            {legend.band95}
          </span>
        </div>

        <div className="features-svg-wrap" role="img" aria-label={active.previewHeadline}>
          <svg viewBox="0 0 540 230" width="540" height="230" className="preview-svg" aria-hidden="true">
            <line x1="0" y1="45" x2="540" y2="45" className="svg-grid-line" />
            <line x1="0" y1="95" x2="540" y2="95" className="svg-grid-line" />
            <line x1="0" y1="145" x2="540" y2="145" className="svg-grid-line" />
            <line x1="0" y1="195" x2="540" y2="195" className="svg-grid-line" />
            <line x1="330" y1="10" x2="330" y2="215" className="svg-origin-line" />

            <polygon
              points="330,112 520,30 520,196 330,112"
              className={emphasizeTail || emphasizeVol ? "svg-cone-95-fill active" : "svg-cone-95-fill"}
            />
            <polygon
              points="330,112 520,62 520,162 330,112"
              className={emphasizeCone || emphasizeVol ? "svg-cone-80-fill active" : "svg-cone-80-fill"}
            />

            <polyline
              points="20,152 62,140 104,146 146,126 188,132 230,108 272,118 302,102 330,112"
              className={emphasizeBacktest ? "svg-actual-line active" : "svg-actual-line"}
            />
            <polyline
              points="62,144 104,142 146,134 188,128 230,118 272,115 302,109 330,113"
              className={emphasizeBacktest ? "svg-backtest-line active" : "svg-backtest-line"}
            />

            <line
              x1="330"
              y1="112"
              x2="520"
              y2="112"
              className={emphasizeCone ? "svg-median-line active" : "svg-median-line"}
            />
            <line
              x1="330"
              y1="112"
              x2="520"
              y2="62"
              className={emphasizeCone || emphasizeVol ? "svg-band80-line active" : "svg-band80-line"}
            />
            <line
              x1="330"
              y1="112"
              x2="520"
              y2="162"
              className={emphasizeCone || emphasizeVol ? "svg-band80-line active" : "svg-band80-line"}
            />
            <line
              x1="330"
              y1="112"
              x2="520"
              y2="30"
              className={emphasizeTail ? "svg-band95-line active" : "svg-band95-line"}
            />
            <line
              x1="330"
              y1="112"
              x2="520"
              y2="196"
              className={emphasizeTail ? "svg-band95-line active" : "svg-band95-line"}
            />
          </svg>
        </div>

        <div className="features-telemetry-strip">
          <div className="telemetry-main">
            <span className="readout-primary-label">{active.previewPrimaryLabel}</span>
            <span className="telemetry-primary-value">{active.previewPrimaryValue}</span>
            <span className="telemetry-headline">{active.previewHeadline}</span>
          </div>
          <div className="telemetry-metrics">
            {active.previewMetrics.map((metric) => (
              <div key={metric.label} className="telemetry-metric-item">
                <span className="keystats-label">{metric.label}</span>
                <span className="keystats-value">{metric.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

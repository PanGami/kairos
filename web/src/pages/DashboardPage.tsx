import { useState } from "react";
import { Link } from "react-router-dom";
import {
  HeroWatcherPreview,
  KeyFeatureChartPreview,
  SmartWarningShowcase,
  WorryHorizonVisual,
} from "../components/DashboardPreviews";
import { useAuth } from "../hooks/useAuth";
import { useLocale } from "../hooks/useLocale";
import type { DashboardFeatureKey } from "../i18n/messages";

export function DashboardPage() {
  const { user } = useAuth();
  const { t } = useLocale();
  const d = t.dashboard;
  const isGuest = !user;
  const [activeFeature, setActiveFeature] = useState<DashboardFeatureKey>("m1");

  return (
    <div className="dash-page">
      <section className="dash-hero-section stage-1" aria-label={d.heroAriaLabel}>
        <div className="dash-hero-copy">
          <h1 className="dash-hero-title">
            {d.heroTitlePrefix}{" "}
            <span className="dash-title-accent">{d.heroTitleAccent}</span>
          </h1>
          <p className="dash-hero-lead">{d.lead}</p>

          <div className="dash-hero-actions">
            <Link to="/watcher" className="btn btn-primary">
              {d.openWatcher}
            </Link>
            <Link to="/methodology" className="btn btn-ghost">
              {d.readMethodology}
            </Link>
            {isGuest && (
              <Link to="/login" className="btn btn-secondary">
                {d.signInGoogle}
              </Link>
            )}
          </div>

          <div className="hero-quick-links" aria-label={d.heroQuickLinksAriaLabel}>
            {d.heroQuickLinks.map((item) => (
              <Link key={item.label} to={item.to} className="hero-quick-pill">
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hero-provenance-block">
            <div className="hero-provenance-label">{d.heroProvenanceTitle}</div>
            <div className="hero-provenance-items">
              {d.heroProvenanceItems.map((item) => (
                <span key={item} className="hero-provenance-item">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <HeroWatcherPreview />
      </section>

      <section className="dash-worry-section stage-2" aria-label={d.worryAriaLabel}>
        <div className="worry-top-block">
          <h2 className="dash-section-heading">{d.worryTitle}</h2>
          <div className="worry-metrics-row">
            {d.worryMetrics.map((metric) => (
              <div key={metric.label} className="worry-metric-item">
                <span className="worry-metric-label">{metric.label}</span>
                <span className="worry-metric-value">{metric.value}</span>
                <span className="worry-metric-sub">{metric.sub}</span>
              </div>
            ))}
          </div>
          <p className="worry-note">
            <strong className="worry-note-lead">{d.worryNoteLabel}</strong> {d.worryNoteText}
          </p>
        </div>

        <div className="worry-highlight-grid">
          <WorryHorizonVisual />
          <div className="worry-highlight-copy">
            <h3 className="worry-highlight-title">{d.worryHighlightTitle}</h3>
            <p className="worry-highlight-desc">{d.worryHighlightDesc}</p>
            <div className="worry-highlight-actions">
              <Link to="/watcher" className="btn btn-primary">
                {d.openWatcher}
              </Link>
              {isGuest && (
                <Link to="/login" className="btn btn-ghost">
                  {d.signInGoogle}
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="dash-benefits-section stage-3" aria-label={d.benefitsAriaLabel}>
        <h2 className="dash-section-heading">{d.benefitsTitle}</h2>
        <div className="dash-benefits-grid">
          {d.benefits.map((item) => (
            <article
              key={item.title}
              className={`dash-benefit-col${item.primary ? " benefit-primary" : ""}`}
            >
              <span className="pill pill-cyan">{item.badge}</span>
              <h3 className="benefit-title">{item.title}</h3>
              <p className="benefit-desc">{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="dash-warning-section" aria-label={d.warningAriaLabel}>
        <div className="warning-copy-col">
          <h2 className="dash-section-heading-left">{d.warningTitle}</h2>
          <p className="warning-desc">{d.warningDesc}</p>
          <div className="warning-copy-actions">
            <Link to="/watcher" className="btn btn-secondary">
              {d.warningAction}
            </Link>
          </div>
        </div>
        <SmartWarningShowcase />
      </section>

      <section className="dash-features-section" aria-label={d.featuresAriaLabel}>
        <KeyFeatureChartPreview activeFeature={activeFeature} />
        <div className="features-list-col">
          <h2 className="dash-section-heading-left">{d.featuresTitle}</h2>
          <div className="features-selector-list" role="group" aria-label={d.featuresListAriaLabel}>
            {d.features.map((feat) => {
              const isSelected = feat.id === activeFeature;
              return (
                <button
                  key={feat.id}
                  type="button"
                  aria-pressed={isSelected}
                  className={`feature-selector-btn${isSelected ? " active" : ""}`}
                  onClick={() => setActiveFeature(feat.id)}
                >
                  <span className="feature-selector-head">
                    <span className="feature-selector-label">{feat.label}</span>
                    <span className="feature-selector-code">{feat.code}</span>
                  </span>
                  <span className="feature-selector-desc">{feat.desc}</span>
                </button>
              );
            })}
          </div>
          <div className="features-cta-row">
            <Link to="/watcher" className="btn btn-primary">
              {d.ctaWatcherFinal}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

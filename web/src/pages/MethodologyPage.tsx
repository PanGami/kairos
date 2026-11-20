import { useLocale } from "../hooks/useLocale";

export function MethodologyPage() {
  const { t } = useLocale();
  const m = t.methodology;

  return (
    <div className="methodology-screen">
      <header className="methodology-header">
        <h1 className="methodology-title">{m.title}</h1>
        <p className="methodology-lead">{m.lead}</p>
      </header>

      <div className="methodology-grid">
        <section className="terminal-widget" aria-label={m.modelsAriaLabel}>
          <div className="widget-header">
            <span className="widget-title">{m.modelsTitle}</span>
            <span className="widget-meta">{m.modelsMeta}</span>
          </div>
          <div className="calibration-body">
            <dl className="model-ledger">
              {m.modelSpecs.map((item) => (
                <div key={item.code} className="model-ledger-row">
                  <dt>{item.code}</dt>
                  <dd>
                    <div className="ledger-title">{item.title}</div>
                    <p className="ledger-desc">{item.desc}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="terminal-widget" aria-label={m.chartGuideAriaLabel}>
          <div className="widget-header">
            <span className="widget-title">{m.chartGuideTitle}</span>
            <span className="widget-meta">{m.chartGuideMeta}</span>
          </div>
          <div className="keystats-table keystats-padded">
            {m.chartSeriesGuide.map((row) => (
              <div key={row.label} className="methodology-guide-row">
                <div className="methodology-guide-head">
                  <span className={`legend-swatch ${row.swatchClass}`} aria-hidden="true" />
                  <span className="ledger-title">{row.label}</span>
                </div>
                <p className="ledger-desc">{row.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="terminal-widget" aria-label={m.limitationsAriaLabel}>
          <div className="widget-header">
            <span className="widget-title">{m.limitationsTitle}</span>
            <span className="widget-meta">{m.limitationsMeta}</span>
          </div>
          <div className="keystats-table keystats-padded">
            {m.limitations.map((item) => (
              <div key={item.label} className="keystats-row">
                <span className="keystats-label">{item.label}</span>
                <span className="methodology-value">{item.value}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="terminal-widget" aria-label={m.provenanceAriaLabel}>
          <div className="widget-header">
            <span className="widget-title">{m.provenanceTitle}</span>
            <span className="widget-meta">{m.provenanceMeta}</span>
          </div>
          <div className="keystats-table keystats-padded">
            {m.provenanceItems.map((item) => (
              <div key={item.label} className="keystats-row">
                <span className="keystats-label">{item.label}</span>
                <span className="methodology-value">{item.value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

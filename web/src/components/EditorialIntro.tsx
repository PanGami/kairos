import { useEffect, useState } from "react";
import { useLocale } from "../hooks/useLocale";

interface Props {
  isGuest: boolean;
}

export function EditorialIntro({ isGuest }: Props) {
  const [expanded, setExpanded] = useState(isGuest);
  const { t } = useLocale();
  const e = t.editorial;

  useEffect(() => {
    setExpanded(isGuest);
  }, [isGuest]);

  return (
    <section className="terminal-widget calibration-widget" aria-label={e.ariaLabel}>
      <div className="widget-header">
        <span className="widget-title">{e.title}</span>
        <button
          type="button"
          className="btn-inline-toggle"
          aria-expanded={expanded}
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? e.collapse : e.expand}
        </button>
      </div>

      <div className="calibration-body">
        <h2 className="calibration-headline">{e.headline}</h2>

        {expanded && (
          <>
            <p className="calibration-copy">{e.copy}</p>
            <dl className="model-ledger">
              {e.models.map((m) => (
                <div key={m.code} className="model-ledger-row">
                  <dt>{e.modelPrefix} {m.code}</dt>
                  <dd>
                    <div className="ledger-title">{m.name}</div>
                    <div className="ledger-desc">{m.spec}</div>
                  </dd>
                </div>
              ))}
            </dl>
          </>
        )}
      </div>
    </section>
  );
}

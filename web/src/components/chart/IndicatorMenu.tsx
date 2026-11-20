import { useEffect, useRef, useState } from "react";
import { useLocale } from "../../hooks/useLocale";
import { INDICATOR_GROUPS, countActiveIndicators, type ChartPrefs, type IndicatorKey } from "../../utils/chartPrefs";

interface Props {
  prefs: ChartPrefs;
  onToggle: (key: IndicatorKey) => void;
  onReset: () => void;
}

export function IndicatorMenu({ prefs, onToggle, onReset }: Props) {
  const { t } = useLocale();
  const m = t.chartUi.menu;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="indicator-menu-root" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className={`chart-tool-btn chart-tool-btn-wide${open ? " active" : ""}`}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        {t.chartUi.indicatorsButton(countActiveIndicators(prefs))}
      </button>

      {open && (
        <div className="indicator-menu" role="group" aria-label={m.ariaLabel}>
          <div className="indicator-menu-head">
            <span className="widget-title">{m.title}</span>
            <button type="button" className="btn-inline-toggle" onClick={onReset}>
              {m.reset}
            </button>
          </div>

          {INDICATOR_GROUPS.map((group) => (
            <div key={group.id} className="indicator-group">
              <div className="indicator-group-title">{m.groups[group.id]}</div>
              {group.keys.map((key) => (
                <label key={key} className="indicator-row">
                  <input
                    type="checkbox"
                    className="indicator-checkbox"
                    checked={prefs.indicators[key]}
                    onChange={() => onToggle(key)}
                  />
                  <span className={`indicator-swatch indicator-swatch-${key}`} aria-hidden="true" />
                  <span className="indicator-copy">
                    <span className="indicator-name">{m.items[key].label}</span>
                    <span className="indicator-desc">{m.items[key].desc}</span>
                  </span>
                </label>
              ))}
            </div>
          ))}

          <div className="indicator-menu-foot">
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
              {m.close}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

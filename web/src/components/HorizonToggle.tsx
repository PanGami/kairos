import { useLocale } from "../hooks/useLocale";
import type { Horizon } from "../types/api.types";

const OPTIONS: Horizon[] = [7, 30];

interface Props {
  value: Horizon;
  onChange: (h: Horizon) => void;
}

export function HorizonToggle({ value, onChange }: Props) {
  const { t } = useLocale();
  return (
    <div className="horizon-control">
      <span className="control-label">{t.horizon.label}</span>
      <div className="horizon-toggle" role="group" aria-label={t.horizon.groupAriaLabel}>
        {OPTIONS.map((h) => (
          <button
            key={h}
            type="button"
            className={`horizon-btn${h === value ? " active" : ""}`}
            aria-pressed={h === value}
            onClick={() => onChange(h)}
          >
            {h}D
          </button>
        ))}
      </div>
    </div>
  );
}

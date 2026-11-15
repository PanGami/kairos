import type { Horizon } from "../types/api.types";

const OPTIONS: Horizon[] = [7, 30];

interface Props {
  value: Horizon;
  onChange: (h: Horizon) => void;
}

export function HorizonToggle({ value, onChange }: Props) {
  return (
    <div className="control-group">
      <span className="control-label">Forecast Horizon</span>
      <div className="horizon-toggle" role="group" aria-label="Horizon">
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

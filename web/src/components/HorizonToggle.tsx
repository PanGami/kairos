import type { Horizon } from "../types/api.types";

const OPTIONS: Horizon[] = [7, 30];

interface Props {
  value: Horizon;
  onChange: (h: Horizon) => void;
}

export function HorizonToggle({ value, onChange }: Props) {
  return (
    <div className="field" role="group" aria-label="Horizon">
      Horizon
      <div className="toggle">
        {OPTIONS.map((h) => (
          <button key={h} className={h === value ? "active" : ""} onClick={() => onChange(h)}>
            {h}d
          </button>
        ))}
      </div>
    </div>
  );
}

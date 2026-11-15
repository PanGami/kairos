import type { Instrument } from "../types/api.types";

interface Props {
  instruments: Instrument[];
  value: string | null;
  onChange: (id: string) => void;
}

export function InstrumentSelect({ instruments, value, onChange }: Props) {
  return (
    <label className="field">
      Instrument
      <select value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
        {instruments.map((i) => (
          <option key={i.instrument_id} value={i.instrument_id}>
            {i.symbol} ({i.mic})
          </option>
        ))}
      </select>
    </label>
  );
}

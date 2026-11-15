import type { Instrument, ReliabilityTier } from "../types/api.types";

interface Props {
  instruments: Instrument[];
  value: string | null;
  featuredId: string | null;
  isGuest: boolean;
  onChange: (id: string) => void;
  onLockedClick: (instrument: Instrument) => void;
}

function tierBadge(tier: ReliabilityTier): { label: string; tone: string } {
  switch (tier) {
    case "full":
      return { label: "FULL TIER", tone: "pill-verified" };
    case "low":
      return { label: "LOW RELIABILITY", tone: "pill-warning" };
    case "insufficient":
      return { label: "INSUFFICIENT DATA", tone: "pill-danger" };
  }
}

export function InstrumentSelect({
  instruments,
  value,
  featuredId,
  isGuest,
  onChange,
  onLockedClick,
}: Props) {
  return (
    <div className="control-group">
      <span className="control-label">Emitter Selection</span>
      <div className="emitter-strip" role="group" aria-label="Emitter selection">
        {instruments.map((inst) => {
          const isFeatured = inst.instrument_id === featuredId;
          const isLocked = isGuest && !isFeatured;
          const isSelected = inst.instrument_id === value;
          const badge = tierBadge(inst.reliability_tier);

          return (
            <button
              key={inst.instrument_id}
              type="button"
              className={`emitter-btn${isSelected ? " active" : ""}${isLocked ? " locked" : ""}`}
              aria-pressed={isSelected}
              onClick={() => (isLocked ? onLockedClick(inst) : onChange(inst.instrument_id))}
            >
              <div className="emitter-top">
                <span className="emitter-ticker">{inst.instrument_id}</span>
                <span className="emitter-mic">{inst.mic}</span>
              </div>
              <div className="emitter-pills">
                {isFeatured && <span className="pill pill-cyan">FEATURED TODAY</span>}
                {isLocked ? (
                  <span className="pill pill-muted">LOCKED</span>
                ) : (
                  <span className={`pill ${badge.tone}`}>{badge.label}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

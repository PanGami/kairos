import type { Instrument, ReliabilityTier } from "../types/api.types";

/** Hard cap for the docked Risk Watcher watchlist. */
export const WATCHLIST_MAX = 5;

/** Lower rank means more confident. The reliability tier is the only per-ticker confidence signal in the list API. */
const TIER_RANK: Record<ReliabilityTier, number> = {
  full: 0,
  low: 1,
  insufficient: 2,
};

/** Sorts most confident first: tier, then the guest-featured ticker, then ticker id for a stable order. */
export function rankByConfidence(instruments: Instrument[], featuredId: string | null): Instrument[] {
  return [...instruments].sort((a, b) => {
    const tier = TIER_RANK[a.reliability_tier] - TIER_RANK[b.reliability_tier];
    if (tier !== 0) return tier;
    const featured = Number(b.instrument_id === featuredId) - Number(a.instrument_id === featuredId);
    if (featured !== 0) return featured;
    return a.instrument_id.localeCompare(b.instrument_id);
  });
}

/**
 * Top `max` tickers by confidence. If the active ticker (for example picked through search)
 * is outside the top slice, it replaces the last slot so the list never exceeds `max`.
 */
export function pickWatchlist(ranked: Instrument[], activeId: string | null, max = WATCHLIST_MAX): Instrument[] {
  const top = ranked.slice(0, max);
  if (!activeId || top.some((i) => i.instrument_id === activeId)) return top;
  const active = ranked.find((i) => i.instrument_id === activeId);
  if (!active) return top;
  const picked = [...top.slice(0, max - 1), active];
  return ranked.filter((i) => picked.includes(i));
}

export function matchesQuery(instrument: Instrument, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    instrument.instrument_id.toLowerCase().includes(q) ||
    instrument.symbol.toLowerCase().includes(q) ||
    instrument.mic.toLowerCase().includes(q)
  );
}

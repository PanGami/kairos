import type { Messages } from "../i18n/messages";
import type { ReliabilityTier } from "../types/api.types";

export interface TierBadge {
  label: string;
  tone: "pill-verified" | "pill-warning" | "pill-danger";
}

/** Single source for the reliability pill used by the watchlist, quote bar, and ticker search. */
export function getTierBadge(tier: ReliabilityTier, t: Messages): TierBadge {
  switch (tier) {
    case "full":
      return { label: t.watchlist.fullTier, tone: "pill-verified" };
    case "low":
      return { label: t.watchlist.lowReliability, tone: "pill-warning" };
    case "insufficient":
      return { label: t.watchlist.insufficientData, tone: "pill-danger" };
  }
}

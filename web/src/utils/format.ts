export const formatPrice = (v: number): string =>
  v.toLocaleString("en-US", { maximumFractionDigits: 0 });

export const formatPct = (v: number, digits = 1): string => `${(v * 100).toFixed(digits)}%`;

/** Signed percentage for price changes, e.g. +1.12% or -0.37%. */
export const formatSignedPct = (v: number, digits = 2): string =>
  `${v >= 0 ? "+" : "-"}${Math.abs(v * 100).toFixed(digits)}%`;

/** Signed absolute change, e.g. +75 or -75. */
export const formatSignedPrice = (v: number): string =>
  `${v >= 0 ? "+" : "-"}${Math.abs(v).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

/** Compact volume: 218.81M, 65.1K, 1.20B. */
export function formatVolume(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return v.toFixed(0);
}

export const formatPrice = (v: number): string =>
  v.toLocaleString("en-US", { maximumFractionDigits: 0 });

export const formatPct = (v: number, digits = 1): string => `${(v * 100).toFixed(digits)}%`;

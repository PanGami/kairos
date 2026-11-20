import type { Theme } from "../../hooks/useTheme";

export interface ChartPalette {
  text: string;
  grid: string;
  crosshair: string;
  crosshairLabelBg: string;
  up: string;
  down: string;
  price: string;
  cone: string;
  warning: string;
  backtest: string;
  sma20: string;
  sma50: string;
  bollinger: string;
}

/** Mirrors the design tokens in styles/tokens.css so canvas colors follow the active theme. */
const DARK: ChartPalette = {
  text: "#9CA3AF",
  grid: "#2A2A2A",
  crosshair: "#9CA3AF",
  crosshairLabelBg: "#2A2A2A",
  up: "#00AB6B",
  down: "#F87171",
  price: "#F3F4F6",
  cone: "#00AB6B",
  warning: "#F59E0B",
  backtest: "#9CA3AF",
  sma20: "#38BDF8",
  sma50: "#C084FC",
  bollinger: "#9CA3AF",
};

const LIGHT: ChartPalette = {
  text: "#525B68",
  grid: "#E0E4EA",
  crosshair: "#525B68",
  crosshairLabelBg: "#121212",
  up: "#006B42",
  down: "#B91C1C",
  price: "#121212",
  cone: "#006B42",
  warning: "#92400E",
  backtest: "#525B68",
  sma20: "#0369A1",
  sma50: "#7E22CE",
  bollinger: "#647080",
};

export const getPalette = (theme: Theme): ChartPalette => (theme === "dark" ? DARK : LIGHT);

/** Converts a #RRGGBB color to rgba() so volume bars and area fills can be translucent. */
export function withAlpha(hex: string, alpha: number): string {
  const n = Number.parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

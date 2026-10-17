/**
 * Design System v2.0 (Neo-Brutalism) — PLAN_Redesign_Neo_Brutalism.md §4.1.
 * Flat, high-saturation accents on warm paper; every edge and shadow is ink.
 * Text on any accent fill is always `ink` so every pairing stays WCAG AA.
 */
export const DESIGN_COLORS = {
  ink: "#111111",
  paper: "#FFF4E0",
  paperDeep: "#EADBC0",
  white: "#FFFFFF",
  muted: "#5C5C5C",
  yellow: "#FFD60A",
  pink: "#FF5CA8",
  blue: "#4D7CFE",
  green: "#2EE59D",
  orange: "#FF8A00",
  red: "#FF3B30",
  purple: "#9B6BFF",
} as const;

/** §4.2 — border widths (px). */
export const DESIGN_BORDER = {
  thin: 2,
  base: 3,
  thick: 5,
  heavy: 6,
} as const;

/** §4.3 — hard offset shadow distances (px); shadows never blur. */
export const DESIGN_SHADOW = {
  sm: 3,
  md: 5,
  lg: 8,
  xl: 12,
  xxl: 16,
} as const;

/** §4.5 — Typography. */
export const DESIGN_FONTS = {
  display: "'Archivo Black', sans-serif",
  ui: "'Space Grotesk', sans-serif",
  mono: "'Space Mono', monospace",
} as const;

/** §4.4 — Border Radius (px). */
export const DESIGN_RADIUS = {
  small: 6,
  card: 12,
  pill: 999,
} as const;

/** §4.6 — Motion durations (ms). */
export const MOTION_DURATIONS = {
  tap: 110,
  pop: 240,
  stamp: 420,
  show: 2200,
} as const;

/** Live session countdown defaults (every game shares one session timer). */
export const DEFAULT_LIVE_TIMER = {
  enabled: true,
  initialMinutes: 30,
  secondsPerCoin: 30,
} as const;

/** Seconds the session stays in overtime (waiting for a gift) once the countdown hits zero. */
export const LIVE_TIMER_GRACE_SECONDS = 120;

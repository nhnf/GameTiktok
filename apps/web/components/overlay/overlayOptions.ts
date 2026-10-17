/** PLAN_Redesign_Neo_Brutalism.md §6.5 — overlay query parameters. */

export const OVERLAY_WIDTH = 1080;
export const OVERLAY_HEIGHT = 1920;

export type OverlayBackground = "paper" | "yellow" | "dark" | "transparent";

export interface OverlayOptions {
  background: OverlayBackground;
  sound: boolean;
  reducedMotion: boolean;
  ticker: boolean;
  howTo: boolean;
  /** Auto Battle: 3D heroes (default) or 2D sprites (`?hero3d=0`) for weak PCs. */
  hero3d: boolean;
}

type SearchParams = Record<string, string | string[] | undefined>;

const BACKGROUNDS: readonly OverlayBackground[] = ["paper", "yellow", "dark", "transparent"];

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function isBackground(value: string | undefined): value is OverlayBackground {
  return value !== undefined && (BACKGROUNDS as readonly string[]).includes(value);
}

export function parseOverlayOptions(params: SearchParams): OverlayOptions {
  const bg = first(params.bg);
  const background: OverlayBackground = isBackground(bg) ? bg : first(params.transparent) === "1" ? "transparent" : "paper";

  return {
    background,
    sound: first(params.sound) !== "0",
    reducedMotion: first(params.reducedMotion) === "1",
    ticker: first(params.ticker) !== "0",
    howTo: first(params.howto) !== "0",
    hero3d: first(params.hero3d) !== "0",
  };
}

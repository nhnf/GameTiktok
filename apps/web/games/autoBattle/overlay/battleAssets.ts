import { UNIT_TYPES, type TeamId, type UnitType } from "@tebak-kata/shared";

/**
 * Sprites cut from "Auto Battle Arena/Karakter Set.png" (transparent PNGs in
 * public/battle/sprites). Team A walks toward the camera (front view), Team
 * B walks away from it (back view) — the sheet ships both views.
 */
export type SpriteView = "front" | "back" | "icon";

export const ARENA_BG_SRC = "/battle/arena_bg.jpg";

export function spriteSrc(team: TeamId, type: UnitType, view: SpriteView): string {
  return `/battle/sprites/${team}_${type}_${view}.png`;
}

/** Head-and-shoulders portrait rendered from the 3D hero (public/battle/portraits). */
export function portraitSrc(team: TeamId, type: UnitType): string {
  return `/battle/portraits/${team}_${type}.png`;
}

const cache = new Map<string, HTMLImageElement>();

/** Returns the image once decoded; null while it's still loading. */
export function getImage(src: string): HTMLImageElement | null {
  let img = cache.get(src);
  if (!img) {
    img = new Image();
    img.decoding = "async";
    img.src = src;
    cache.set(src, img);
  }
  return img.complete && img.naturalWidth > 0 ? img : null;
}

/** Kick off every download up front so the first battle frame isn't blank. */
export function preloadBattleAssets(): void {
  getImage(ARENA_BG_SRC);
  for (const team of ["A", "B"] as const) {
    for (const type of UNIT_TYPES) {
      getImage(spriteSrc(team, type, "front"));
      getImage(spriteSrc(team, type, "back"));
    }
  }
}

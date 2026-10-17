import { GAME_INFO, type GameType } from "@tebak-kata/shared";

/** PLAN §6.2 — yellow logo sticker with a tilted, blinking LIVE badge. */
export function OverlayHeader({ activeGame = "TEBAK_KATA", reducedMotion = false }: { activeGame?: GameType; reducedMotion?: boolean }) {
  return (
    <div className="relative">
      <div className="-rotate-1 rounded-nb border-5 border-ink bg-yellow px-10 pb-3 pt-3.5 shadow-nb-lg">
        <div className="whitespace-nowrap font-display text-[72px] uppercase leading-none text-ink">{GAME_INFO[activeGame].label.replace(/\s*LIVE$/i, "")}</div>
      </div>
      <div className="absolute -right-8 -top-5 flex rotate-6 items-center gap-2.5 rounded-full border-4 border-ink bg-red px-4 py-1.5 shadow-nb-sm">
        <span className={`h-4 w-4 rounded-full border-2 border-ink bg-white ${reducedMotion ? "" : "animate-blink"}`} aria-hidden />
        <span className="font-display text-[26px] leading-none text-ink">LIVE</span>
      </div>
    </div>
  );
}

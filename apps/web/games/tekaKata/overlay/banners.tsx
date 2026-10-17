import type { ServerEvent } from "@tebak-kata/shared";
import { GiftCallout, PlayerPoints, StampTitle } from "@/components/overlay/widgets/BannerParts";
import type { BannerSpec } from "../../overlayTypes";

/** Susun Kata celebrations (PRD Teka Kata §60 events). */
export function tekaKataBanner(event: ServerEvent): BannerSpec | null {
  switch (event.type) {
    case "TK_WORD_FOUND": {
      const { player, points, word } = event.payload;
      return {
        durationMs: 2200,
        sound: "winner",
        dim: true,
        confetti: true,
        placement: "center",
        render: (motion) => (
          <div className="flex flex-col items-center gap-14">
            <StampTitle motion={motion}>Kata ditemukan!</StampTitle>
            <div className="rounded-nb border-5 border-ink bg-paper px-10 py-5 shadow-nb-lg">
              <div className="font-display text-[96px] uppercase leading-none tracking-widest text-ink">{word}</div>
            </div>
            <PlayerPoints username={player.username} points={points} />
          </div>
        ),
      };
    }
    case "TK_PUZZLE_COMPLETED": {
      const { foundWords, totalWords, autoNext } = event.payload;
      return {
        durationMs: 2800,
        sound: "winner",
        dim: true,
        confetti: true,
        queue: true,
        placement: "center",
        render: (motion) => (
          <div className="flex flex-col items-center gap-10 text-center">
            <div className={`-rotate-2 rounded-nb border-6 border-ink bg-yellow px-14 py-8 shadow-nb-xl ${motion ? "animate-stamp" : ""}`}>
              <div className="font-display text-[92px] uppercase leading-none text-ink">🎉 Puzzle selesai!</div>
              <div className="mt-4 font-display text-[56px] uppercase leading-none text-ink">
                {foundWords} / {totalWords} kata terbuka
              </div>
            </div>
            <div className="rounded-full border-4 border-ink bg-white px-8 py-3 font-display text-[32px] uppercase tracking-wider text-ink shadow-nb-md">
              {autoNext ? "Menyiapkan puzzle berikutnya..." : "Tunggu puzzle berikutnya dari host"}
            </div>
          </div>
        ),
      };
    }
    case "GIFT_RECEIVED": {
      const view = event.payload;
      return { durationMs: 1800, sound: "gift", placement: "free", render: (m) => <GiftCallout view={view} motion={m} /> };
    }
    default:
      return null;
  }
}

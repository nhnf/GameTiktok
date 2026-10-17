import { DESIGN_COLORS, type PlayerRef, type PuzzlePublicState, type ServerEvent } from "@tebak-kata/shared";
import { GiftCallout, NoteCallout, PlayerPoints, PointsBurst, StampTitle } from "@/components/overlay/widgets/BannerParts";
import type { BannerSpec } from "../../overlayTypes";
import { WordDisplay } from "./WordDisplay";

function WinnerBanner({ winner, points, word, motion, boss }: { winner: PlayerRef; points: number; word: string; motion: boolean; boss: boolean }) {
  return (
    <div className="flex flex-col items-center gap-20">
      <StampTitle tone={boss ? "bg-purple" : "bg-green"} size={boss ? 88 : 132} tilt="-rotate-[8deg]" motion={motion}>
        {boss ? "Boss kalah!" : "Benar!"}
      </StampTitle>
      <div className="rounded-nb border-5 border-ink bg-paper p-5 shadow-nb-lg">
        <WordDisplay display={word.split("")} context="banner" solved reducedMotion />
      </div>
      <PlayerPoints username={winner.username} points={points} />
    </div>
  );
}

function BossStartedBanner({ puzzle, motion }: { puzzle: PuzzlePublicState; motion: boolean }) {
  return (
    <div className="flex w-[1080px] flex-col items-center gap-8">
      <div className={`bg-hazard w-full border-y-6 border-ink py-6 ${motion ? "animate-hazard-scroll" : ""}`}>
        <div className="mx-auto w-fit -rotate-2 rounded-nb border-6 border-ink bg-purple px-10 py-4 shadow-nb-xl">
          <div className="whitespace-nowrap font-display text-[80px] uppercase leading-none text-ink">⚠ Boss round</div>
        </div>
      </div>
      <div className="rounded-nb border-5 border-ink bg-white px-8 py-4 text-center shadow-nb-lg">
        <div className="text-[26px] font-bold uppercase tracking-wider text-ink">Kategori</div>
        <div className="font-display text-[56px] uppercase leading-none text-ink">
          <span aria-hidden>{puzzle.category.emoji} </span>
          {puzzle.category.name}
        </div>
      </div>
      <PointsBurst points={puzzle.rewardPoints} color={DESIGN_COLORS.yellow} />
    </div>
  );
}

function SkippedBanner({ word, motion }: { word: string; motion: boolean }) {
  return (
    <div className="flex flex-col items-center gap-20">
      <div className={`-rotate-[8deg] rounded-nb border-6 border-ink bg-white px-10 py-4 shadow-nb-xl ${motion ? "animate-stamp" : ""}`}>
        <div className="font-display text-[110px] uppercase leading-none text-muted">Dilewati</div>
      </div>
      <div className="max-w-[936px] rounded-nb border-5 border-ink bg-yellow px-8 py-4 text-center shadow-nb-lg">
        <div className="text-[26px] font-bold uppercase text-ink">Jawabannya</div>
        <div className="break-all font-display text-[64px] uppercase leading-none text-ink">{word}</div>
      </div>
    </div>
  );
}

/** Tebak Kata celebrations (PRD §39 events). */
export function tebakKataBanner(event: ServerEvent): BannerSpec | null {
  switch (event.type) {
    case "PLAYER_WON": {
      const { winner, points, word } = event.payload;
      return { durationMs: 2200, sound: "winner", dim: true, confetti: true, placement: "center", render: (m) => <WinnerBanner winner={winner} points={points} word={word} motion={m} boss={false} /> };
    }
    case "BOSS_DEFEATED": {
      const { winner, points, word } = event.payload;
      return { durationMs: 2800, sound: "winner", dim: true, confetti: true, placement: "center", render: (m) => <WinnerBanner winner={winner} points={points} word={word} motion={m} boss /> };
    }
    case "BOSS_STARTED": {
      const puzzle = event.payload;
      return { durationMs: 2600, sound: "boss", dim: true, queue: true, placement: "center", render: (m) => <BossStartedBanner puzzle={puzzle} motion={m} /> };
    }
    case "PUZZLE_SKIPPED": {
      const { word } = event.payload;
      return { durationMs: 1600, dim: true, placement: "center", render: (m) => <SkippedBanner word={word} motion={m} /> };
    }
    case "GIFT_RECEIVED": {
      const view = event.payload;
      return { durationMs: 1800, sound: "gift", placement: "free", render: (m) => <GiftCallout view={view} motion={m} /> };
    }
    case "ALL_LETTERS_REVEALED":
      return { durationMs: 1500, placement: "free", render: (m) => <NoteCallout title="Semua huruf terbuka!" body="Siapa paling cepat?" motion={m} /> };
    default:
      return null;
  }
}

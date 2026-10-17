"use client";

import { useState } from "react";
import type { PuzzleHostState } from "@tebak-kata/shared";
import { Card, CardTitle } from "@/components/ui/Card";
import { CategoryBadge, DifficultyBadge } from "@/components/ui/Badge";
import { WordDisplay } from "../overlay/WordDisplay";

/**
 * Design System §26/28 — host can see the target answer; the overlay never
 * does. The answer starts hidden (PLAN §9) in case the host screen is on camera.
 */
export function TebakKataPuzzlePanel({ puzzle }: { puzzle: PuzzleHostState | null }) {
  if (!puzzle) {
    return (
      <Card className="flex min-h-[200px] flex-col items-center justify-center gap-2 text-center">
        <div className="text-3xl" aria-hidden>
          🔤
        </div>
        <div className="font-display text-lg uppercase">Belum ada kata aktif</div>
        <div className="text-sm font-medium text-muted">Mulai sesi atau klik “Kata baru”.</div>
      </Card>
    );
  }

  return <PuzzleCard key={puzzle.puzzleId} puzzle={puzzle} />;
}

function PuzzleCard({ puzzle }: { puzzle: PuzzleHostState }) {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <Card tone={puzzle.isBoss ? "purple" : "white"} className="animate-pop-in">
      <div className="mb-4 flex items-center justify-between gap-2">
        <CardTitle className="mb-0">Kata saat ini</CardTitle>
        <div className="flex items-center gap-2">
          {puzzle.isBoss && <span className="rounded-full border-2 border-ink bg-yellow px-2 py-0.5 text-[11px] font-bold uppercase">👑 Boss</span>}
          <span className="rounded-full border-2 border-ink bg-white px-2 py-0.5 font-mono text-xs font-bold">+{puzzle.rewardPoints} pts</span>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-3 rounded-nb-sm border-3 border-ink bg-paper px-3 py-2">
        <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider">Jawaban</span>
        <span className="min-w-0 flex-1 truncate font-display text-2xl uppercase leading-none tracking-wide">
          {showAnswer ? puzzle.targetWord : "•".repeat(puzzle.targetWord.length)}
        </span>
        <button
          type="button"
          onClick={() => setShowAnswer((value) => !value)}
          aria-pressed={showAnswer}
          className="shrink-0 rounded-nb-sm border-2 border-ink bg-white px-2 py-1 text-xs font-bold uppercase hover:bg-yellow"
        >
          {showAnswer ? "🙈 Tutup" : "👁 Intip"}
        </button>
      </div>

      <div className="mb-4 flex justify-center rounded-nb-sm border-3 border-dashed border-ink bg-paper px-2 py-4">
        <WordDisplay display={puzzle.display} context="host" solved={puzzle.status === "SOLVED"} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <CategoryBadge name={puzzle.category.name} emoji={puzzle.category.emoji} size="sm" />
        <DifficultyBadge difficulty={puzzle.difficulty} />
      </div>
    </Card>
  );
}

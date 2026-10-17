"use client";

import { useState } from "react";
import type { TekaKataPuzzleHostState } from "@tebak-kata/shared";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { errorMessage } from "@/lib/errors";
import { ErrorNote } from "@/components/ui/ErrorNote";
import { tekaKataApi } from "../api";

interface TekaKataPuzzlePanelProps {
  token: string;
  puzzle: TekaKataPuzzleHostState | null;
}

export function TekaKataPuzzlePanel({ token, puzzle }: TekaKataPuzzlePanelProps) {
  const [revealingWordId, setRevealingWordId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!puzzle) {
    return (
      <Card tone="paper">
        <CardTitle>Susun Kata — puzzle aktif</CardTitle>
        <div className="flex h-48 flex-col items-center justify-center gap-2 text-center">
          <span className="text-3xl">🧩</span>
          <p className="text-sm font-bold uppercase text-muted">Belum ada puzzle Susun Kata.</p>
          <p className="text-xs text-muted">Puzzle dibuat otomatis saat sesi dimulai, atau klik &quot;Generate&quot;.</p>
        </div>
      </Card>
    );
  }

  const isComplete = puzzle.status === "COMPLETED";

  const handleRevealWord = async (wordId: string) => {
    setRevealingWordId(wordId);
    try {
      await tekaKataApi.revealWord(token, wordId);
    } catch (err) {
      setError(errorMessage(err, "Gagal membuka kata."));
    } finally {
      setRevealingWordId(null);
    }
  };

  return (
    <Card tone="paper">
      <CardTitle>Susun Kata — monitor crossword</CardTitle>
      <div className="flex flex-col gap-4">
        {/* Top Info Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink pb-3">
          <div className="flex items-center gap-2">
            <Badge tone="yellow">{puzzle.category.name}</Badge>
            <Badge tone={puzzle.isBoss ? "purple" : "blue"}>{puzzle.difficulty.toUpperCase()}</Badge>
            {puzzle.isBoss && <Badge tone="pink">👑 BOSS</Badge>}
          </div>
          <span className="font-mono text-xs font-bold">
            {puzzle.foundWords} / {puzzle.totalWords} KATA DITEMUKAN
          </span>
        </div>

        {/* Letter Pool Strip */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">Huruf Tersedia (Pool):</span>
          <div className="flex flex-wrap gap-1.5">
            {puzzle.letters.map((letter, idx) => (
              <span
                key={idx}
                className="flex h-8 w-8 items-center justify-center rounded-nb-sm border-2 border-ink bg-white font-display text-base font-bold shadow-nb-sm"
              >
                {letter}
              </span>
            ))}
          </div>
        </div>

        {/* Grid Preview (Host View) */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">Grid Preview:</span>
          <div className="flex justify-center overflow-x-auto rounded-nb-sm border-2 border-ink bg-paper-deep p-3">
            <div
              className="grid gap-1"
              style={{
                gridTemplateColumns: `repeat(${puzzle.gridColumns}, minmax(0, 1fr))`,
              }}
            >
              {puzzle.gridCells.map((cell, idx) => {
                if (!cell.isOccupied) {
                  return (
                    <div
                      key={idx}
                      className="h-7 w-7 rounded-sm border border-transparent bg-transparent"
                    />
                  );
                }

                const isFound = cell.isFound;
                const isRevealed = cell.isRevealed;

                return (
                  <div
                    key={idx}
                    className={`flex h-7 w-7 items-center justify-center rounded-sm border-2 border-ink font-display text-xs font-bold transition-all ${
                      isFound
                        ? "bg-green text-ink shadow-sm"
                        : isRevealed
                          ? "bg-yellow text-ink"
                          : "bg-white text-ink/60"
                    }`}
                    title={`(${cell.row},${cell.column}) Letter: ${cell.actualLetter}`}
                  >
                    {cell.actualLetter}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Answer Monitor (PRD Section 34) */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">Status Target Kata:</span>
          <div className="flex max-h-48 flex-col gap-2 overflow-y-auto pr-1">
            {puzzle.words.map((w) => {
              const isFound = w.isFound;
              const isRevealed = w.isRevealed;

              return (
                <div
                  key={w.id}
                  className={`flex items-center justify-between rounded-nb-sm border-2 border-ink p-2 text-xs transition-all ${
                    isFound ? "bg-green/30" : isRevealed ? "bg-yellow/30" : "bg-white"
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-sm tracking-wide">
                        {isFound ? "✓" : isRevealed ? "🔍" : "○"} {w.word}
                      </span>
                      <span className="rounded-sm bg-ink/10 px-1 py-0.5 font-mono text-[10px] font-bold">
                        +{w.points} pts
                      </span>
                      <span className="text-[10px] uppercase text-muted">
                        ({w.direction === "horizontal" ? "Horiz" : "Vert"})
                      </span>
                    </div>
                    {isFound && w.foundBy && (
                      <span className="text-[11px] font-bold text-ink">
                        Ditemukan oleh <span className="underline">@{w.foundBy.username}</span>
                      </span>
                    )}
                    {isRevealed && !isFound && (
                      <span className="text-[11px] font-semibold text-muted">Dibuka oleh Host / Gift</span>
                    )}
                  </div>

                  {!isFound && !isRevealed && puzzle.status === "ACTIVE" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-[10px]"
                      onClick={() => handleRevealWord(w.id)}
                      disabled={revealingWordId === w.id}
                    >
                      {revealingWordId === w.id ? "..." : "Buka Kata"}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {error && <ErrorNote message={error} />}

        {isComplete && (
          <div className="rounded-nb-sm border-2 border-ink bg-green p-3 text-center text-xs font-bold uppercase shadow-nb-sm">
            🎉 Puzzle Selesai! Semua kata berhasil ditemukan / dibuka.
          </div>
        )}
      </div>
    </Card>
  );
}

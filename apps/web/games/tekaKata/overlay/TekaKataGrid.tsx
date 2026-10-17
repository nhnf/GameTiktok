"use client";

import type { TekaKataGridCellPublic } from "@tebak-kata/shared";

interface TekaKataGridProps {
  gridRows: number;
  gridColumns: number;
  gridCells: TekaKataGridCellPublic[];
  reducedMotion?: boolean;
}

export function TekaKataGrid({
  gridRows,
  gridColumns,
  gridCells,
  reducedMotion = false,
}: TekaKataGridProps) {
  // Max size constraints for 1080px overlay width:
  // Target max grid width ~780px, max grid height ~440px
  const cols = Math.max(gridColumns, 1);
  const rows = Math.max(gridRows, 1);
  const cellSize = Math.min(
    Math.floor(760 / cols),
    Math.floor(430 / rows),
    68,
  );
  const fontSize = Math.max(Math.floor(cellSize * 0.56), 22);

  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className="grid gap-1.5 rounded-nb border-4 border-ink bg-white/90 p-3 shadow-nb-lg"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        }}
      >
        {gridCells.map((cell, idx) => {
          if (!cell.isOccupied) {
            return (
              <div
                key={idx}
                style={{ width: cellSize, height: cellSize }}
                className="rounded-sm bg-transparent opacity-0"
              />
            );
          }

          const isFound = cell.isFound;
          const isRevealed = cell.isRevealed;
          const hasLetter = cell.letter !== null;

          return (
            <div
              key={idx}
              style={{
                width: cellSize,
                height: cellSize,
                fontSize: `${fontSize}px`,
              }}
              className={`flex items-center justify-center rounded-nb-sm border-3 border-ink font-display font-black uppercase leading-none shadow-nb-sm transition-transform ${
                isFound
                  ? "bg-green text-ink shadow-nb-sm scale-100"
                  : isRevealed
                    ? "bg-yellow text-ink scale-100"
                    : "bg-white text-transparent"
              } ${!reducedMotion && (isFound || isRevealed) ? "animate-pop-in" : ""}`}
            >
              {hasLetter ? cell.letter : ""}
            </div>
          );
        })}
      </div>
    </div>
  );
}

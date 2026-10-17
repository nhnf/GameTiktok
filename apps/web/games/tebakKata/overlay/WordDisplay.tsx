"use client";

import type { CSSProperties } from "react";
import { DESIGN_COLORS } from "@tebak-kata/shared";

type Context = "overlay" | "host" | "banner";

interface LayoutRule {
  /** Available row width in px. */
  width: number;
  maxTile: number;
  maxTileTwoRows: number;
  /** Words at least this long wrap onto two rows to stay readable. */
  twoRowsFrom: number;
  /** Gap for rows of ≤6 / ≤10 / more tiles. */
  gaps: [number, number, number];
}

/** PLAN_Redesign_Neo_Brutalism.md §6.3 — overlay content width is 936px (1080 − 2×72). */
const LAYOUT: Record<Context, LayoutRule> = {
  overlay: { width: 936, maxTile: 140, maxTileTwoRows: 96, twoRowsFrom: 14, gaps: [16, 12, 8] },
  host: { width: 340, maxTile: 52, maxTileTwoRows: 44, twoRowsFrom: 11, gaps: [8, 6, 5] },
  /** Solved word inside the winner banner — smaller so the stamp and name stay clear. */
  banner: { width: 936, maxTile: 110, maxTileTwoRows: 80, twoRowsFrom: 12, gaps: [14, 10, 8] },
};

export interface TileMetrics {
  tile: number;
  height: number;
  gap: number;
  font: number;
  border: number;
  shadow: number;
  rows: number;
  perRow: number;
}

export function tileMetrics(length: number, context: Context): TileMetrics {
  const rule = LAYOUT[context];
  const count = Math.max(1, length);
  const rows = count >= rule.twoRowsFrom ? 2 : 1;
  const perRow = Math.ceil(count / rows);
  const gap = perRow <= 6 ? rule.gaps[0] : perRow <= 10 ? rule.gaps[1] : rule.gaps[2];
  const fit = Math.floor((rule.width - gap * (perRow - 1)) / perRow);
  const tile = Math.min(rows === 2 ? rule.maxTileTwoRows : rule.maxTile, fit);
  return {
    tile,
    height: Math.round(tile * 1.2),
    gap,
    font: Math.round(tile * 0.62),
    border: tile >= 90 ? 6 : tile >= 44 ? 4 : 3,
    shadow: tile >= 90 ? 8 : tile >= 44 ? 5 : 3,
    rows,
    perRow,
  };
}

interface WordDisplayProps {
  display: (string | null)[];
  context?: Context;
  /** Position most recently revealed — that tile flips in and flashes yellow. */
  pulsePosition?: number | null;
  pulseSeq?: number;
  /** Puzzle solved — revealed tiles turn green. */
  solved?: boolean;
  reducedMotion?: boolean;
  /** Tiles drop in one by one when the component mounts (new puzzle). */
  entrance?: boolean;
}

/**
 * Design System v2.0 — the word is rendered as chunky ink-bordered tiles
 * (deliberately replacing v1's underline style, PLAN §3 D2). Long words
 * wrap onto two rows instead of shrinking below readability.
 */
export function WordDisplay({
  display,
  context = "overlay",
  pulsePosition = null,
  pulseSeq,
  solved = false,
  reducedMotion = false,
  entrance = false,
}: WordDisplayProps) {
  const metrics = tileMetrics(display.length, context);
  const indexed = display.map((letter, index) => ({ letter, index }));
  const rows = Array.from({ length: metrics.rows }, (_, row) => indexed.slice(row * metrics.perRow, (row + 1) * metrics.perRow));
  const label = display.map((letter) => letter ?? "kosong").join(", ");

  return (
    <div className="flex flex-col items-center" style={{ gap: Math.round(metrics.gap * 1.5) }} role="img" aria-label={`Kata: ${label}`}>
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center" style={{ gap: metrics.gap }}>
          {row.map(({ letter, index }) => (
            <Tile
              key={index}
              letter={letter}
              index={index}
              metrics={metrics}
              pulsing={pulsePosition === index}
              pulseSeq={pulseSeq}
              solved={solved}
              animate={!reducedMotion}
              entrance={entrance}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

interface TileProps {
  letter: string | null;
  index: number;
  metrics: TileMetrics;
  pulsing: boolean;
  pulseSeq?: number;
  solved: boolean;
  animate: boolean;
  entrance: boolean;
}

function Tile({ letter, index, metrics, pulsing, pulseSeq, solved, animate, entrance }: TileProps) {
  const dropIn = animate && entrance;
  const frameStyle: CSSProperties = {
    width: metrics.tile,
    height: metrics.height,
    borderWidth: metrics.border,
    boxShadow: `${metrics.shadow}px ${metrics.shadow}px 0 0 ${DESIGN_COLORS.ink}`,
    animationDelay: dropIn ? `${index * 40}ms` : undefined,
  };
  const face = letter ? (solved ? "bg-green" : "bg-white") : "bg-paper-deep";

  return (
    // The frame keeps a stable key so the drop-in plays once; only the face
    // remounts (via its key) to replay the reveal flip on each new pulse.
    <div className={`relative shrink-0 overflow-hidden rounded-nb border-ink ${dropIn ? "animate-drop-in" : ""}`} style={frameStyle}>
      <div
        key={pulsing ? `pulse-${pulseSeq}` : "face"}
        className={`flex h-full w-full items-center justify-center font-display leading-none text-ink ${face} ${animate && pulsing ? "animate-tile-reveal" : ""}`}
        style={{ fontSize: metrics.font }}
      >
        {letter ?? <span className="text-ink/20">?</span>}
      </div>
    </div>
  );
}

"use client";

import { useMemo, type CSSProperties } from "react";
import { DESIGN_COLORS } from "@tebak-kata/shared";

const COLORS = [DESIGN_COLORS.yellow, DESIGN_COLORS.pink, DESIGN_COLORS.blue, DESIGN_COLORS.green, DESIGN_COLORS.orange, DESIGN_COLORS.purple];
const SHAPES = ["square", "bar", "circle"] as const;
const PIECE_COUNT = 44;

interface Piece {
  left: number;
  color: string;
  shape: (typeof SHAPES)[number];
  delay: number;
  duration: number;
  drift: number;
  spin: number;
  size: number;
}

/** Design System §38 — flat, ink-outlined confetti; only for wins and boss defeats. */
export function Confetti({ seed }: { seed: number }) {
  const pieces = useMemo<Piece[]>(() => {
    // Deterministic per-seed PRNG so each burst differs but renders stay stable.
    let state = seed || 1;
    const rand = () => {
      state = (state * 9301 + 49297) % 233280;
      return state / 233280;
    };
    return Array.from({ length: PIECE_COUNT }, () => ({
      left: rand() * 100,
      color: COLORS[Math.floor(rand() * COLORS.length)],
      shape: SHAPES[Math.floor(rand() * SHAPES.length)],
      delay: rand() * 0.35,
      duration: 1.6 + rand() * 1.1,
      drift: (rand() - 0.5) * 320,
      spin: 360 + rand() * 540,
      size: 22 + rand() * 20,
    }));
  }, [seed]);

  return (
    <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden">
      {pieces.map((piece, index) => (
        <span
          key={index}
          className={`absolute -top-12 border-3 border-ink ${piece.shape === "circle" ? "rounded-full" : "rounded-sm"}`}
          style={
            {
              left: `${piece.left}%`,
              width: piece.size,
              height: piece.shape === "bar" ? piece.size * 0.45 : piece.size,
              backgroundColor: piece.color,
              animation: `confetti-fall ${piece.duration}s cubic-bezier(.3,.6,.5,1) ${piece.delay}s both`,
              "--drift": `${piece.drift}px`,
              "--spin": `${piece.spin}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

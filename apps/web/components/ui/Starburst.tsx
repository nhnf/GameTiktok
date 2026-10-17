import type { ReactNode } from "react";
import { DESIGN_COLORS } from "@tebak-kata/shared";

interface StarburstProps {
  size: number;
  color?: string;
  points?: number;
  className?: string;
  children?: ReactNode;
}

function starPoints(points: number): string {
  const outer = 48;
  const inner = 37;
  return Array.from({ length: points * 2 }, (_, i) => {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI * i) / points - Math.PI / 2;
    return `${(50 + radius * Math.cos(angle)).toFixed(2)},${(50 + radius * Math.sin(angle)).toFixed(2)}`;
  }).join(" ");
}

/** Design System v2.0 §4.7 — sticker-style starburst with a hard ink shadow, e.g. behind "+10 POIN". */
export function Starburst({ size, color = DESIGN_COLORS.yellow, points = 14, className = "", children }: StarburstProps) {
  const polygon = starPoints(points);
  return (
    <div className={`relative inline-flex shrink-0 items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 106 106" className="absolute inset-0 h-full w-full" aria-hidden>
        <polygon points={polygon} transform="translate(6 6)" fill={DESIGN_COLORS.ink} />
        <polygon points={polygon} fill={color} stroke={DESIGN_COLORS.ink} strokeWidth="3" strokeLinejoin="round" />
      </svg>
      <div className="relative">{children}</div>
    </div>
  );
}

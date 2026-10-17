"use client";

import type { ReactNode } from "react";
import { useFitScale } from "@/lib/useFitScale";

/** Renders a fixed-size stage scaled down to fit its container (1:1 inside OBS). */
export function ScaledStage({ width, height, children }: { width: number; height: number; children: ReactNode }) {
  const { ref, scale } = useFitScale<HTMLDivElement>(width, height);

  return (
    <div ref={ref} className="flex h-full w-full items-start justify-center overflow-hidden">
      <div className="relative shrink-0" style={{ width: width * scale, height: height * scale }}>
        <div className="absolute left-0 top-0" style={{ width, height, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

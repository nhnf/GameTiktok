"use client";

import type { GiftGoalState } from "@tebak-kata/shared";

interface GiftGoalBarProps {
  goal: GiftGoalState | null | undefined;
  reducedMotion?: boolean;
}

export function GiftGoalBar({ goal, reducedMotion = false }: GiftGoalBarProps) {
  if (!goal || goal.targetCoins <= 0) return null;

  const current = Math.max(0, goal.currentCoins);
  const target = goal.targetCoins;
  const percent = Math.min(100, Math.max(0, Math.round((current / target) * 100)));
  const remaining = Math.max(0, target - current);

  return (
    <div className="w-full rounded-nb border-4 border-ink bg-white p-2.5 shadow-nb-md">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-display text-[18px] font-black uppercase tracking-wider text-ink">
          <span>🎯 TARGET GIFT (TIER #{goal.tier})</span>
          <span className="rounded-full border-2 border-ink bg-purple px-2 py-0.5 text-[14px] text-white">
            👑 BOSS ROUND 3X POIN
          </span>
        </div>
        <div className="font-mono text-[18px] font-black text-ink">
          {current}/{target} KOIN ({percent}%)
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="relative h-6 w-full overflow-hidden rounded-full border-3 border-ink bg-paper-deep">
        <div
          className={`h-full border-r-3 border-ink bg-yellow transition-all duration-500 ${
            percent >= 100 ? "bg-green animate-pulse" : ""
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Footer hint */}
      <div className="mt-1 flex items-center justify-between text-[13px] font-bold text-muted">
        <span>
          {remaining === 0
            ? "🎉 Target tercapai! Boss round segera dimulai!"
            : `Kirim gift apa saja! Kurang ${remaining} koin lagi menuju Boss Round.`}
        </span>
        {goal.lastGifter && (
          <span className="truncate text-ink">
            Gifter terakhir: <b>@{goal.lastGifter}</b>
          </span>
        )}
      </div>
    </div>
  );
}

"use client";

import type { LiveSessionTimer } from "@tebak-kata/shared";
import { coinRuleLabel, formatDuration, useLiveCountdown } from "@/lib/useLiveCountdown";

/** Topbar countdown of the LIVE session (and the overtime grace period). */
export function LiveTimerPill({ timer, paused }: { timer: LiveSessionTimer; paused: boolean }) {
  const { remaining, grace } = useLiveCountdown(timer);

  if (timer.isOvertimeGrace) {
    return (
      <span className="inline-flex h-9 animate-pulse items-center gap-2 rounded-full border-3 border-ink bg-red px-3.5 text-xs font-black uppercase text-white shadow-nb-sm">
        <span>🚨 Overtime</span>
        <span className="font-mono text-sm">{formatDuration(grace)}</span>
        <span className="text-[10px] text-yellow">({coinRuleLabel(timer.secondsPerCoin)})</span>
      </span>
    );
  }

  const warning = !paused && remaining <= 60 && remaining > 0;
  return (
    <span
      className={`inline-flex h-9 items-center gap-2 rounded-full border-3 border-ink px-3.5 text-xs font-black uppercase shadow-nb-sm transition-colors ${
        warning ? "animate-pulse bg-red text-white" : "bg-white text-ink"
      }`}
      title={coinRuleLabel(timer.secondsPerCoin)}
    >
      <span>{paused ? "⏸" : "⏳"} Sesi LIVE</span>
      <span className="font-mono text-base font-black tracking-tight">{formatDuration(remaining)}</span>
      {timer.secondsAddedByGifts > 0 && (
        <span className="rounded-full bg-green px-1.5 text-[10px] font-bold normal-case text-ink">+{Math.round(timer.secondsAddedByGifts / 60)} mnt</span>
      )}
    </span>
  );
}

"use client";

import type { LiveSessionTimer } from "@tebak-kata/shared";
import { coinRuleLabel, formatDuration, useLiveCountdown } from "@/lib/useLiveCountdown";

interface LiveSessionTimerWidgetProps {
  timer: LiveSessionTimer | null;
  status: string;
  reducedMotion?: boolean;
}

/** Full-width LIVE countdown banner ("gift = more time"), or the overtime alarm. */
export function LiveSessionTimerWidget({ timer, status, reducedMotion = false }: LiveSessionTimerWidgetProps) {
  const { remaining, grace } = useLiveCountdown(timer);
  if (!timer || !timer.enabled || status === "ENDED" || status === "CREATED") return null;
  const rule = coinRuleLabel(timer.secondsPerCoin);

  if (timer.isOvertimeGrace) {
    return (
      <div className={`w-full rounded-full border-5 border-ink bg-red px-6 py-3 shadow-nb-lg ${reducedMotion ? "" : "animate-pulse"}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-[34px] leading-none">🚨</span>
            <span className="font-display text-[26px] uppercase text-white">Waktu habis!</span>
            <span className="rounded-full border-3 border-ink bg-yellow px-4 py-0.5 font-mono text-[28px] font-black text-ink shadow-nb-sm">⏱ {formatDuration(grace)}</span>
          </div>
          <span className="rounded-full border-3 border-ink bg-white px-4 py-1 font-display text-[20px] uppercase text-ink shadow-nb-sm">
            Kirim gift: <span className="font-mono text-red underline">{rule}</span>
          </span>
        </div>
      </div>
    );
  }

  const warning = status === "ACTIVE" && remaining <= 60 && remaining > 0;
  return (
    <div
      className={`flex w-full items-center justify-between rounded-full border-4 border-ink px-6 py-2 shadow-nb-md transition-all ${
        warning ? `bg-red text-white ${reducedMotion ? "" : "animate-pulse"}` : "bg-white text-ink"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-[30px] leading-none">{status === "PAUSED" ? "⏸" : "⏳"}</span>
        <div className="flex items-baseline gap-2">
          <span className={`font-display text-[20px] uppercase tracking-wider ${warning ? "text-white/80" : "text-ink/70"}`}>Sesi LIVE:</span>
          <span className="font-mono text-[36px] font-black leading-none">{formatDuration(remaining)}</span>
        </div>
      </div>
      {timer.secondsPerCoin > 0 && (
        <div className="flex items-center gap-2 rounded-full border-3 border-ink bg-yellow px-4 py-1.5 shadow-nb-sm">
          <span className="text-[20px]">🎁</span>
          <span className="font-display text-[20px] uppercase text-ink">
            Biar tambah lama: <span className="underline decoration-2">{rule}</span>
          </span>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import type { LiveSessionTimer } from "@tebak-kata/shared";

/** "05:09" / "1:02:03". */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

/** Seconds left until an ISO timestamp, re-rendering every `intervalMs` (0 when null). */
export function useSecondsUntil(isoEnd: string | null | undefined, intervalMs = 250): number {
  const compute = () => (isoEnd ? Math.max(0, Math.ceil((Date.parse(isoEnd) - Date.now()) / 1000)) : 0);
  const [seconds, setSeconds] = useState(compute);

  useEffect(() => {
    setSeconds(compute());
    if (!isoEnd) return;
    const id = setInterval(() => setSeconds(compute()), intervalMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isoEnd, intervalMs]);

  return seconds;
}

/**
 * Live session countdown for display: ticks from `endsAt` while running,
 * shows the frozen `secondsRemaining` while paused, and the grace countdown
 * during overtime.
 */
export function useLiveCountdown(timer: LiveSessionTimer | null | undefined): { remaining: number; grace: number } {
  const running = useSecondsUntil(timer?.endsAt ?? null);
  const grace = useSecondsUntil(timer?.isOvertimeGrace ? timer.graceEndsAt : null);
  if (!timer) return { remaining: 0, grace: 0 };
  return {
    remaining: timer.endsAt ? running : timer.secondsRemaining,
    grace: timer.isOvertimeGrace ? (timer.graceEndsAt ? grace : timer.graceSecondsRemaining) : 0,
  };
}

/** "1 Koin = +30s" style label for the gift → time rule. */
export function coinRuleLabel(secondsPerCoin: number | undefined): string {
  const s = secondsPerCoin ?? 30;
  if (s <= 0) return "Gift tidak menambah waktu";
  return s % 60 === 0 ? `1 Koin = +${s / 60} menit` : `1 Koin = +${s}s`;
}

"use client";

import { useEffect, useState } from "react";

/** Re-renders on an interval so time-windowed views (guess heat, ticker) stay current. */
export function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}

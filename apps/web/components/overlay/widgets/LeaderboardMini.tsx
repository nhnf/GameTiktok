"use client";

import { useEffect, useRef, useState } from "react";
import type { LeaderboardEntry } from "@tebak-kata/shared";

const RISE_BADGE_MS = 1800;

interface LeaderboardMiniProps {
  entries: LeaderboardEntry[];
  reducedMotion: boolean;
  maxEntries?: number;
}

function PlayerAvatarMini({ url, name }: { url?: string; name: string }) {
  const [error, setError] = useState(false);
  const initial = name ? name.charAt(0).toUpperCase() : "?";

  if (url && !error) {
    return (
      <img
        src={url}
        alt={name}
        onError={() => setError(true)}
        className="h-10 w-10 shrink-0 rounded-full border-2 border-ink bg-paper-deep object-cover shadow-sm"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-blue font-display text-[18px] font-black uppercase text-ink shadow-sm">
      {initial}
    </div>
  );
}

/** Design System §20 — overlay scoreboard with Top 10 rank display, user avatars, and rank gains ("NAIK!"). */
export function LeaderboardMini({
  entries,
  reducedMotion,
  maxEntries = 10,
}: LeaderboardMiniProps) {
  const topList = entries.slice(0, maxEntries);
  const risen = useRankRises(topList);

  return (
    <div className="w-full overflow-hidden rounded-nb border-5 border-ink bg-white shadow-nb-lg">
      <div className="flex items-center justify-between bg-ink px-4 py-2.5">
        <span className="font-display text-[28px] uppercase leading-none text-yellow">
          🏆 Top {maxEntries}
        </span>
        <span className="text-[18px] font-bold uppercase tracking-wider text-white/80">
          Poin
        </span>
      </div>

      {topList.length === 0 ? (
        <div className="border-t-3 border-ink px-4 py-8 text-center text-[24px] font-bold text-ink">
          Belum ada pemain — jadilah #1!
        </div>
      ) : (
        topList.map((entry, index) => {
          const isFirst = index === 0;
          const isSecond = index === 1;
          const isThird = index === 2;

          const rowBg = isFirst
            ? "bg-yellow"
            : isSecond
              ? "bg-paper-deep"
              : isThird
                ? "bg-paper"
                : "bg-white";

          const rankBadgeBg = isFirst
            ? "bg-ink text-yellow"
            : isSecond
              ? "bg-ink text-white"
              : isThird
                ? "bg-ink/80 text-white"
                : "bg-ink/10 text-ink";

          return (
            <div
              key={entry.userId}
              className={`flex h-[62px] items-center gap-2.5 border-t-2 border-ink/40 px-3 transition-colors ${rowBg}`}
            >
              {/* Rank position number */}
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-nb-sm border-2 border-ink font-display text-[18px] font-bold leading-none shadow-sm ${rankBadgeBg}`}
              >
                {index + 1}
              </span>

              {/* Profile avatar */}
              <PlayerAvatarMini url={entry.avatarUrl} name={entry.username} />

              {/* Username & Combo Badge */}
              <div className="flex min-w-0 flex-1 items-center gap-1.5">
                {isFirst && <span aria-hidden>👑</span>}
                <span className="truncate text-[23px] font-bold text-ink">{entry.username}</span>
                {entry.streak && entry.streak >= 2 ? (
                  <span
                    className={`shrink-0 rounded-full border-2 border-ink bg-orange px-2 py-0.5 font-display text-[13px] font-black text-white shadow-sm ${
                      reducedMotion ? "" : "animate-pulse"
                    }`}
                  >
                    🔥 {entry.streak}x
                  </span>
                ) : null}
              </div>

              {/* Rank rise badge */}
              {risen.has(entry.userId) && (
                <span
                  className={`shrink-0 rounded-full border-2 border-ink bg-green px-2 py-0.5 font-display text-[14px] uppercase leading-none text-ink ${
                    reducedMotion ? "" : "animate-pop-in"
                  }`}
                >
                  ▲ Naik!
                </span>
              )}

              {/* Points */}
              <span className="shrink-0 font-mono text-[26px] font-bold leading-none text-ink">
                {entry.points}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
}

/** User ids that entered the top ranks or moved up since the previous leaderboard snapshot. */
function useRankRises(top: LeaderboardEntry[]): Set<string> {
  const previous = useRef<Map<string, number> | null>(null);
  const [risen, setRisen] = useState<Set<string>>(() => new Set());
  const signature = top.map((entry) => entry.userId).join("|");

  useEffect(() => {
    const ranks = new Map(
      signature ? signature.split("|").map((userId, rank) => [userId, rank] as const) : [],
    );
    const before = previous.current;
    previous.current = ranks;
    if (!before) return;

    const up = new Set<string>();
    ranks.forEach((rank, userId) => {
      const oldRank = before.get(userId);
      if (oldRank === undefined || rank < oldRank) up.add(userId);
    });

    setRisen(up);
    if (up.size === 0) return;
    const timer = setTimeout(() => setRisen(new Set()), RISE_BADGE_MS);
    return () => clearTimeout(timer);
  }, [signature]);

  return risen;
}

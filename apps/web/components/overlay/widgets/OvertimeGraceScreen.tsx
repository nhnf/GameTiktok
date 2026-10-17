"use client";

import type { LeaderboardEntry, LiveSessionTimer } from "@tebak-kata/shared";
import { coinRuleLabel, formatDuration, useLiveCountdown } from "@/lib/useLiveCountdown";

interface OvertimeGraceScreenProps {
  timer: LiveSessionTimer;
  leaderboard: LeaderboardEntry[];
  reducedMotion?: boolean;
}

function TopPlayerMini({
  rank,
  player,
}: {
  rank: number;
  player: LeaderboardEntry;
}) {
  const isFirst = rank === 1;
  const isSecond = rank === 2;
  const initial = player.username ? player.username.charAt(0).toUpperCase() : "?";

  const badgeBg = isFirst
    ? "bg-yellow text-ink border-yellow"
    : isSecond
      ? "bg-paper-deep text-ink border-ink/40"
      : "bg-orange text-white border-orange";

  const pedestalHeight = isFirst ? "h-20" : isSecond ? "h-16" : "h-12";

  return (
    <div className={`flex flex-col items-center gap-1.5 ${isFirst ? "w-[170px] -translate-y-2 z-10" : "w-[150px]"}`}>
      <span className="font-display text-[15px] uppercase text-ink">
        {isFirst ? "👑 #1 TOP SKOR" : `#${rank}`}
      </span>

      {/* Avatar */}
      <div className="relative">
        {player.avatarUrl ? (
          <img
            src={player.avatarUrl}
            alt={player.username}
            className={`shrink-0 rounded-full border-4 border-ink bg-paper-deep object-cover shadow-nb-sm ${
              isFirst ? "h-16 w-16" : "h-14 w-14"
            }`}
          />
        ) : (
          <div
            className={`flex shrink-0 items-center justify-center rounded-full border-4 border-ink bg-blue font-display font-black uppercase text-ink shadow-nb-sm ${
              isFirst ? "h-16 w-16 text-2xl" : "h-14 w-14 text-xl"
            }`}
          >
            {initial}
          </div>
        )}
      </div>

      {/* Username */}
      <span className="max-w-full truncate rounded-nb-sm border-2 border-ink bg-white px-2 py-0.5 text-xs font-bold text-ink">
        @{player.username}
      </span>

      {/* Points pedestal */}
      <div
        className={`flex w-full flex-col items-center justify-center rounded-t-nb border-3 border-ink px-2 py-1 shadow-nb-sm ${badgeBg} ${pedestalHeight}`}
      >
        <span className="font-mono text-sm font-black leading-none">
          {player.points} PTS
        </span>
      </div>
    </div>
  );
}

export function OvertimeGraceScreen({
  timer,
  leaderboard,
  reducedMotion = false,
}: OvertimeGraceScreenProps) {
  const { grace: secondsLeft } = useLiveCountdown(timer);

  const top3 = leaderboard.slice(0, 3);
  const orderedTop3 = [
    top3[1] ? { rank: 2, player: top3[1] } : null,
    top3[0] ? { rank: 1, player: top3[0] } : null,
    top3[2] ? { rank: 3, player: top3[2] } : null,
  ].filter(Boolean) as { rank: number; player: LeaderboardEntry }[];

  return (
    <div className="absolute inset-x-[72px] top-[300px] z-50 flex flex-col items-center">
      <div
        className={`flex w-full max-w-[940px] flex-col items-center gap-6 rounded-nb border-8 border-ink bg-white p-8 text-center shadow-nb-2xl ${
          reducedMotion ? "" : "animate-pop-in"
        }`}
      >
        {/* Header Alert Ribbon */}
        <div className="-rotate-1 rounded-nb border-5 border-ink bg-red px-8 py-3 text-white shadow-nb-lg">
          <div className="font-display text-[44px] font-black uppercase leading-none">
            🚨 WAKTU LIVE HABIS — GAME DIJEDA!
          </div>
        </div>

        {/* 2-Minute Overtime Countdown Banner */}
        <div className="flex flex-col items-center gap-2 rounded-nb border-4 border-ink bg-yellow px-8 py-4 shadow-nb-md">
          <span className="text-[16px] font-black uppercase tracking-wider text-ink/80">
            Sisa waktu tambahan:
          </span>
          <div className="flex items-center gap-3">
            <span className="text-[38px] animate-pulse">⏱</span>
            <span className="font-mono text-[56px] font-black leading-none text-ink">
              {formatDuration(secondsLeft)}
            </span>
          </div>
          <span className="text-sm font-bold text-red">
            ⚠️ Jika waktu habis tanpa koin/gift tambahan, LIVE akan otomatis berakhir!
          </span>
        </div>

        {/* Call to Action: 1 Koin = +60s */}
        <div className="rotate-1 rounded-full border-4 border-ink bg-green px-8 py-3 shadow-nb-md">
          <span className="font-display text-[22px] uppercase text-ink">
            🎁 Kirim gift untuk lanjut bermain: <span className="underline decoration-2">{coinRuleLabel(timer.secondsPerCoin)}</span>
          </span>
        </div>

        {/* TOP 3 CURRENT PLAYERS SECTION */}
        {orderedTop3.length > 0 && (
          <div className="flex w-full flex-col items-center gap-3 border-t-3 border-ink/20 pt-4">
            <span className="font-display text-[22px] font-black uppercase text-ink">
              🏆 Pemimpin Skor Saat Ini:
            </span>
            <div className="flex items-end justify-center gap-4">
              {orderedTop3.map(({ rank, player }) => (
                <TopPlayerMini key={player.userId} rank={rank} player={player} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

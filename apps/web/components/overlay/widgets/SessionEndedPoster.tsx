"use client";

import { useState } from "react";
import { GAME_INFO, type LeaderboardEntry, type SessionSummary } from "@tebak-kata/shared";

// Podium columns render as 2nd (Left) · 1st (Center, largest) · 3rd (Right).
const PODIUM_ORDER = [1, 0, 2];

function LaurelWreathBadge({
  rank,
  children,
}: {
  rank: number;
  children: React.ReactNode;
}) {
  const isFirst = rank === 0;
  const isSecond = rank === 1;

  const ringGlow = isFirst
    ? "border-[#EAB308] ring-4 ring-[#EAB308]/40 shadow-[0_0_25px_rgba(234,179,8,0.6)]"
    : isSecond
      ? "border-[#E2E8F0] ring-4 ring-slate-300/40 shadow-[0_0_20px_rgba(226,232,240,0.5)]"
      : "border-[#F97316] ring-4 ring-[#F97316]/40 shadow-[0_0_20px_rgba(249,115,22,0.5)]";

  const wreathColor = isFirst ? "#EAB308" : isSecond ? "#E2E8F0" : "#F97316";

  return (
    <div className="relative flex items-center justify-center">
      {/* Laurel Wreath SVG Wings */}
      <svg
        className={`absolute pointer-events-none ${
          isFirst
            ? "w-[240px] h-[240px] -bottom-3"
            : "w-[190px] h-[190px] -bottom-2"
        }`}
        viewBox="0 0 200 200"
        fill="none"
      >
        {/* Left Laurel Branch */}
        <path
          d="M 30 110 C 25 150 65 180 100 190 C 80 170 55 145 50 110 C 46 80 60 50 78 35 C 62 48 38 72 34 100 Z"
          fill={wreathColor}
          stroke="#1E1E1E"
          strokeWidth="2.5"
        />
        {/* Left Leaves */}
        <ellipse cx="38" cy="75" rx="8" ry="14" transform="rotate(-30 38 75)" fill={wreathColor} stroke="#1E1E1E" strokeWidth="2" />
        <ellipse cx="28" cy="105" rx="9" ry="15" transform="rotate(-10 28 105)" fill={wreathColor} stroke="#1E1E1E" strokeWidth="2" />
        <ellipse cx="42" cy="138" rx="9" ry="15" transform="rotate(20 42 138)" fill={wreathColor} stroke="#1E1E1E" strokeWidth="2" />
        <ellipse cx="68" cy="168" rx="8" ry="14" transform="rotate(50 68 168)" fill={wreathColor} stroke="#1E1E1E" strokeWidth="2" />

        {/* Right Laurel Branch */}
        <path
          d="M 170 110 C 175 150 135 180 100 190 C 120 170 145 145 150 110 C 154 80 140 50 122 35 C 138 48 162 72 166 100 Z"
          fill={wreathColor}
          stroke="#1E1E1E"
          strokeWidth="2.5"
        />
        {/* Right Leaves */}
        <ellipse cx="162" cy="75" rx="8" ry="14" transform="rotate(30 162 75)" fill={wreathColor} stroke="#1E1E1E" strokeWidth="2" />
        <ellipse cx="172" cy="105" rx="9" ry="15" transform="rotate(10 172 105)" fill={wreathColor} stroke="#1E1E1E" strokeWidth="2" />
        <ellipse cx="158" cy="138" rx="9" ry="15" transform="rotate(-20 158 138)" fill={wreathColor} stroke="#1E1E1E" strokeWidth="2" />
        <ellipse cx="132" cy="168" rx="8" ry="14" transform="rotate(-50 132 168)" fill={wreathColor} stroke="#1E1E1E" strokeWidth="2" />
      </svg>

      {/* Circular Avatar Photo Frame */}
      <div
        className={`relative z-10 flex items-center justify-center rounded-full bg-ink border-6 overflow-hidden ${ringGlow}`}
      >
        {children}
      </div>
    </div>
  );
}

function PosterAvatar({
  url,
  name,
  size = "lg",
}: {
  url?: string;
  name?: string;
  size?: "xl" | "lg" | "sm";
}) {
  const [error, setError] = useState(false);
  const initial = name && name !== "-" ? name.charAt(0).toUpperCase() : "?";

  const sizeClass =
    size === "xl"
      ? "h-32 w-32 text-5xl"
      : size === "lg"
        ? "h-24 w-24 text-3xl"
        : "h-7 w-7 text-xs";

  if (url && !error) {
    return (
      <img
        src={url}
        alt={name || "Player"}
        onError={() => setError(true)}
        className={`${sizeClass} shrink-0 object-cover`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} shrink-0 flex items-center justify-center font-display font-black uppercase text-yellow bg-ink`}
    >
      {initial}
    </div>
  );
}

export function SessionEndedPoster({
  summary,
  leaderboard,
}: {
  summary: SessionSummary;
  leaderboard: LeaderboardEntry[];
}) {
  const allEntries =
    leaderboard.length > 0
      ? leaderboard
      : summary.leaderboard && summary.leaderboard.length > 0
        ? summary.leaderboard
        : summary.topPlayer
          ? [summary.topPlayer]
          : [];

  const top3Entries = [allEntries[0] ?? null, allEntries[1] ?? null, allEntries[2] ?? null];
  const restEntries = allEntries.slice(3, 48); // Ranks 4 - 48 in 3 columns

  return (
    <div className="relative flex w-full max-w-[980px] flex-col items-center gap-6 rounded-nb border-8 border-ink bg-[#141416] p-8 text-white shadow-nb-2xl overflow-hidden">
      {/* Overhead Spotlights Effect */}
      <div className="absolute top-0 inset-x-0 h-96 pointer-events-none flex justify-between px-16 opacity-35">
        <div className="w-56 h-full bg-gradient-to-b from-yellow/60 via-yellow/20 to-transparent blur-2xl -rotate-12" />
        <div className="w-72 h-full bg-gradient-to-b from-white/80 via-yellow/30 to-transparent blur-2xl" />
        <div className="w-56 h-full bg-gradient-to-b from-yellow/60 via-yellow/20 to-transparent blur-2xl rotate-12" />
      </div>

      {/* Header Banner */}
      <div className="-rotate-1 z-10 rounded-nb border-5 border-ink bg-yellow px-10 py-3 shadow-nb-lg">
        <div className="font-display text-[58px] font-black uppercase leading-none text-ink">
          🏆 Juara {summary.activeGame ? GAME_INFO[summary.activeGame].label.replace(/\s*LIVE$/i, "") : "LIVE"}
        </div>
      </div>

      {allEntries.length === 0 && (
        <div className="z-10 rounded-nb border-4 border-ink bg-white px-8 py-6 text-center text-ink shadow-nb-lg">
          <div className="font-display text-[44px] uppercase leading-none">Belum ada pemenang</div>
          <div className="mt-2 text-[24px] font-bold">Terima kasih sudah menonton — main lagi di LIVE berikutnya!</div>
        </div>
      )}

      {/* TOP 1, 2, 3 PODIUM STAGE */}
      <div className={`relative z-10 w-full items-end justify-center gap-6 pb-2 pt-4 ${allEntries.length === 0 ? "hidden" : "flex"}`}>
        {PODIUM_ORDER.map((rankIndex) => {
          const entry = top3Entries[rankIndex];
          const isFirst = rankIndex === 0;
          const rankNumber = rankIndex + 1;

          const pedestalWidth = isFirst ? "w-[280px]" : "w-[230px]";
          const pedestalHeight = isFirst ? "h-40" : rankIndex === 1 ? "h-32" : "h-28";
          const pedestalBg = isFirst
            ? "bg-gradient-to-b from-[#E7D095] via-[#D1B875] to-[#967C3A] text-ink"
            : rankIndex === 1
              ? "bg-gradient-to-b from-[#E2E8F0] via-[#CBD5E1] to-[#94A3B8] text-ink"
              : "bg-gradient-to-b from-[#FDBA74] via-[#FB923C] to-[#C2410C] text-ink";

          return (
            <div
              key={rankNumber}
              className={`flex flex-col items-center gap-2 ${pedestalWidth} ${
                isFirst ? "-translate-y-4 z-20" : "z-10"
              }`}
            >
              {/* Laurel Wreath Avatar Frame */}
              <LaurelWreathBadge rank={rankIndex}>
                <PosterAvatar
                  url={entry?.avatarUrl}
                  name={entry?.username}
                  size={isFirst ? "xl" : "lg"}
                />
              </LaurelWreathBadge>

              {/* Username */}
              <div className="max-w-full truncate rounded-full border-3 border-ink bg-white px-4 py-1 text-[22px] font-black text-ink shadow-nb-sm">
                @{entry ? entry.username : "-"}
              </div>

              {/* Cylindrical 3D Pedestal */}
              <div
                className={`flex w-full flex-col items-center justify-between rounded-t-3xl border-5 border-ink pt-3 pb-2 shadow-nb-xl ${pedestalBg} ${pedestalHeight}`}
              >
                <span className="font-display text-[64px] font-black leading-none text-ink drop-shadow-md">
                  {rankNumber}
                </span>
                <div className="rounded-full border-2 border-ink bg-ink px-3 py-0.5 text-center">
                  <span className="font-mono text-[20px] font-black leading-none text-yellow">
                    {entry ? `${entry.points.toLocaleString("id-ID")} PTS` : "0 PTS"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* RANKS 4 - 48 (3-COLUMN GRID LIST — ALL VISIBLE WITHOUT SCROLL) */}
      {restEntries.length > 0 && (
        <div className="relative z-10 w-full rounded-nb border-5 border-ink bg-[#1F2024] p-4 shadow-nb-lg">
          <div className="flex items-center justify-between border-b-2 border-white/20 pb-2 mb-3">
            <span className="font-display text-[22px] font-black uppercase text-yellow">
              🎖️ Peringkat 4 – {Math.min(48, allEntries.length)}
            </span>
            <span className="text-[14px] font-bold uppercase text-white/70">
              Total {allEntries.length} Pemain
            </span>
          </div>

          {/* 3 Columns Grid without scroll */}
          <div className="grid grid-cols-3 gap-2">
            {restEntries.map((entry, idx) => {
              const rankNum = idx + 4;
              return (
                <div
                  key={entry.userId}
                  className="flex h-10 items-center gap-2 rounded-nb-sm border-2 border-ink bg-white px-2 shadow-sm text-ink"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border border-ink bg-ink text-yellow font-mono text-[12px] font-black">
                    {rankNum}
                  </span>
                  {entry.avatarUrl ? (
                    <img
                      src={entry.avatarUrl}
                      alt={entry.username}
                      className="h-6 w-6 shrink-0 rounded-full border border-ink object-cover"
                    />
                  ) : (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-ink bg-blue font-display text-[10px] font-black uppercase text-ink">
                      {entry.username ? entry.username.charAt(0).toUpperCase() : "?"}
                    </div>
                  )}
                  <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-ink">
                    {entry.username}
                  </span>
                  <span className="shrink-0 font-mono text-[13px] font-black text-ink">
                    {entry.points}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer message */}
      <div className="relative z-10 rounded-full border-3 border-ink bg-yellow px-6 py-2 text-[20px] font-black uppercase text-ink shadow-nb-sm">
        Sampai jumpa di LIVE berikutnya! 👋
      </div>
    </div>
  );
}

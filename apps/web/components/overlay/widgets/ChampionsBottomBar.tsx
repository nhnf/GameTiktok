"use client";

import { useState } from "react";
import type { ChampionEntry } from "@tebak-kata/shared";

interface ChampionsBottomBarProps {
  champions?: ChampionEntry[] | null;
  reducedMotion?: boolean;
  maxEntries?: number;
}

function ChampionAvatarMini({ url, name }: { url?: string; name: string }) {
  const [error, setError] = useState(false);
  const initial = name ? name.charAt(0).toUpperCase() : "?";

  if (url && !error) {
    return (
      <img
        src={url}
        alt={name}
        onError={() => setError(true)}
        className="h-9 w-9 shrink-0 rounded-full border-2 border-ink bg-paper-deep object-cover shadow-sm"
      />
    );
  }

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-yellow font-display text-[16px] font-black uppercase text-ink shadow-sm">
      {initial}
    </div>
  );
}

/** Vertical card displaying reigning / defending champions (Juara #1 dari sesi-sesi sebelumnya). */
export function ChampionsBottomBar({
  champions = [],
  maxEntries = 5,
}: ChampionsBottomBarProps) {
  const list = (champions ?? []).slice(0, maxEntries);

  return (
    <div className="w-full overflow-hidden rounded-nb border-5 border-ink bg-white shadow-nb-lg">
      <div className="flex items-center border-b-3 border-ink bg-yellow px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-[20px] leading-none">👑</span>
          <span className="font-display text-[22px] uppercase leading-none text-ink">
            Daftar Juara Bertahan
          </span>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="px-4 py-5 text-center text-[18px] font-bold text-ink">
          👑 Belum ada juara bertahan — rebut #1 di sesi ini!
        </div>
      ) : (
        list.map((champ, index) => (
          <div
            key={`${champ.userId}-${index}`}
            className="flex h-[56px] items-center gap-2.5 border-t-2 border-ink/40 bg-white px-3 first:border-t-0"
          >
            {/* Rank position badge */}
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-nb-sm border-2 border-ink font-display text-[14px] font-bold leading-none shadow-sm ${
                index === 0
                  ? "bg-yellow text-ink"
                  : index === 1
                    ? "bg-paper-deep text-ink"
                    : index === 2
                      ? "bg-paper text-ink"
                      : "bg-white text-ink"
              }`}
            >
              {index === 0 ? "👑" : index + 1}
            </span>

            {/* Profile avatar */}
            <ChampionAvatarMini url={champ.avatarUrl} name={champ.username} />

            {/* Username */}
            <div className="min-w-0 flex-1">
              <div className="truncate text-[20px] font-bold leading-tight text-ink">
                @{champ.username}
              </div>
            </div>

            {/* Champion Win Count (Berapa kali Juara) */}
            <span className="shrink-0 rounded-full border-2 border-ink bg-yellow px-2.5 py-0.5 font-display text-[15px] font-black uppercase text-ink shadow-sm">
              {champ.championCount}× Juara
            </span>
          </div>
        ))
      )}
    </div>
  );
}

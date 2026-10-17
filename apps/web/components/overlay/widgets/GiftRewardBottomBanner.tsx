"use client";

import { useEffect, useRef, useState } from "react";
import type { ServerEvent, SessionGiftRewardView } from "@tebak-kata/shared";
import { playSfx } from "@/lib/sound";

interface GiftRewardBottomBannerProps {
  lastEvent?: (ServerEvent & { seq: number }) | null;
  subscribe?: (listener: (event: ServerEvent & { seq: number }) => void) => () => void;
  soundEnabled?: boolean;
  reducedMotion?: boolean;
}

const DISPLAY_DURATION_MS = 3800;

export function GiftRewardBottomBanner({
  lastEvent,
  subscribe,
  soundEnabled = true,
  reducedMotion = false,
}: GiftRewardBottomBannerProps) {
  const [current, setCurrent] = useState<SessionGiftRewardView | null>(null);
  const queue = useRef<SessionGiftRewardView[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const showing = useRef(false);

  const showItem = (item: SessionGiftRewardView) => {
    clearTimeout(timer.current);
    showing.current = true;
    setCurrent(item);
    if (soundEnabled) {
      playSfx("gift", true);
    }

    timer.current = setTimeout(() => {
      const next = queue.current.shift();
      if (next) {
        showItem(next);
      } else {
        showing.current = false;
        setCurrent(null);
      }
    }, DISPLAY_DURATION_MS);
  };

  const onEvent = (e: ServerEvent) => {
    if (e.type === "GIFT_REWARD") {
      const reward = e.payload;
      if (showing.current) {
        queue.current.push(reward);
      } else {
        showItem(reward);
      }
    }
  };

  useEffect(() => {
    return () => clearTimeout(timer.current);
  }, []);

  useEffect(() => {
    if (!subscribe) return;
    return subscribe((e) => onEvent(e));
  }, [subscribe]);

  useEffect(() => {
    if (subscribe || !lastEvent) return;
    onEvent(lastEvent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastEvent?.seq, subscribe]);

  if (!current) return null;

  const motion = !reducedMotion;
  const cardBg = current.isScoreReset
    ? "bg-red"
    : current.rankRose
      ? "bg-yellow"
      : "bg-paper-deep";

  return (
    <div className="pointer-events-none absolute inset-x-[72px] bottom-[60px] z-50">
      <div
        key={current.id}
        className={`flex items-center justify-between gap-5 rounded-nb border-5 border-ink ${cardBg} p-4 shadow-nb-xl ${
          motion ? "animate-slide-in-right" : ""
        }`}
      >
        {/* Left Icon / Avatar */}
        <div className="flex shrink-0 items-center justify-center">
          {current.avatarUrl ? (
            <img
              src={current.avatarUrl}
              alt={current.username}
              className="h-16 w-16 rounded-full border-3 border-ink bg-white object-cover shadow-sm"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = "none";
              }}
            />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-nb border-3 border-ink bg-white text-[34px] leading-none shadow-sm">
              🎁
            </span>
          )}
        </div>

        {/* Middle Info */}
        <div className="min-w-0 flex-1">
          {/* Sender & Gift Header */}
          <div className="flex items-center gap-2">
            <span className="max-w-[400px] truncate rounded-nb-sm border-2 border-ink bg-ink px-2.5 py-0.5 font-display text-[22px] font-black uppercase text-yellow">
              @{current.username}
            </span>
            <span className="font-display text-[22px] uppercase text-ink">
              kirim <b>{current.coins} coin</b>
              {current.giftName ? ` (${current.giftName})` : ""}
            </span>
          </div>

          {/* Reward & Effects */}
          <div className="mt-1 flex flex-wrap items-center gap-2 font-display text-[26px] uppercase leading-tight text-ink">
            <span>=</span>
            {current.isScoreReset ? (
              <>
                <span className="rounded-full border-2 border-ink bg-ink px-3 py-0.5 font-black text-yellow">
                  🔥 RESET SKOR
                </span>
                <span className="font-black text-white">+{current.pointsAwarded} POINT</span>
              </>
            ) : current.deductedOpponentPoints && current.deductedOpponentPoints > 0 ? (
              <>
                <span className="font-black text-ink">+{current.pointsAwarded} POINT</span>
                <span className="rounded-full border-2 border-ink bg-red px-2.5 py-0.5 text-[20px] font-black text-white">
                  -{current.deductedOpponentPoints} POINT LAWAN
                </span>
              </>
            ) : (
              <span className="font-black text-ink">+{current.pointsAwarded} POINT</span>
            )}

            {current.addedSeconds > 0 && (
              <>
                <span className="text-[20px] font-bold text-ink/70">dan</span>
                <span className="rounded-nb-sm border-2 border-ink bg-blue px-2.5 py-0.5 font-mono text-[22px] font-black text-white shadow-sm">
                  +{current.addedSeconds}s WAKTU
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right: Rank Up Badge */}
        {current.rankRose && current.newRank !== null && current.newRank !== undefined && (
          <div
            className={`flex shrink-0 flex-col items-center justify-center rounded-nb border-4 border-ink ${
              current.newRank === 1 ? "bg-yellow" : "bg-green"
            } px-5 py-2 text-ink shadow-nb-sm ${motion ? "animate-pop-in" : ""}`}
          >
            <span className="font-display text-[14px] font-black uppercase leading-tight tracking-wider text-ink">
              {current.newRank === 1 ? "👑 TOP #1!" : "▲ NAIK RANK!"}
            </span>
            <span className="font-display text-[30px] font-black leading-none text-ink">
              #{current.newRank}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

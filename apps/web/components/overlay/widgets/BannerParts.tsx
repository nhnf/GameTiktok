import type { ReactNode } from "react";
import type { GiftEventView } from "@tebak-kata/shared";
import { Starburst } from "@/components/ui/Starburst";

/** Tilted "stamp" headline used by every celebration banner. */
export function StampTitle({ children, tone = "bg-green", size = 110, tilt = "-rotate-[6deg]", motion }: { children: ReactNode; tone?: string; size?: number; tilt?: string; motion: boolean }) {
  return (
    <div className={`${tilt} rounded-nb border-6 border-ink px-12 py-5 shadow-nb-xl ${tone} ${motion ? "animate-stamp" : ""}`}>
      <div className="whitespace-nowrap font-display uppercase leading-none text-ink" style={{ fontSize: size }}>
        {children}
      </div>
    </div>
  );
}

/** "@username  (+10 POIN)" row. */
export function PlayerPoints({ username, points, size = 230 }: { username: string; points: number; size?: number }) {
  return (
    <div className="flex items-center gap-6">
      <div className="max-w-[520px] truncate rounded-nb border-5 border-ink bg-pink px-8 py-4 font-display text-[52px] leading-none text-ink shadow-nb-lg">
        @{username}
      </div>
      <PointsBurst points={points} size={size} />
    </div>
  );
}

export function PointsBurst({ points, size = 230, color }: { points: number; size?: number; color?: string }) {
  return (
    <Starburst size={size} color={color}>
      <div className="text-center font-display leading-none text-ink">
        <div style={{ fontSize: Math.round(size * 0.24) }}>+{points}</div>
        <div style={{ fontSize: Math.round(size * 0.12) }}>POIN</div>
      </div>
    </Starburst>
  );
}

/** Pink callout sliding in from the right when a gift opens a letter. */
export function GiftCallout({ view, motion, effectText = "➜ Buka 1 huruf!" }: { view: GiftEventView; motion: boolean; effectText?: string }) {
  return (
    <div className="absolute right-[40px] top-[1000px] w-[660px]">
      <div className={`flex items-center gap-5 rounded-nb border-6 border-ink bg-pink p-5 shadow-nb-xl ${motion ? "animate-slide-in-right" : "-rotate-2"}`}>
        <span className="flex h-[96px] w-[96px] shrink-0 items-center justify-center rounded-nb border-5 border-ink bg-white text-[56px] leading-none">🎁</span>
        <div className="min-w-0">
          <div className="truncate text-[30px] font-bold text-ink">
            @{view.username} kirim {view.giftName}
          </div>
          <div className="font-display text-[44px] uppercase leading-none text-ink">{effectText}</div>
        </div>
      </div>
    </div>
  );
}

/** Small orange note ("every letter is open"). */
export function NoteCallout({ title, body, motion }: { title: string; body: string; motion: boolean }) {
  return (
    <div className="absolute inset-x-0 top-[1120px] flex justify-center">
      <div className="rotate-2">
        <div className={`rounded-nb border-5 border-ink bg-orange px-8 py-4 text-center shadow-nb-lg ${motion ? "animate-pop-in" : ""}`}>
          <div className="font-display text-[40px] uppercase leading-none text-ink">{title}</div>
          <div className="mt-2 text-[28px] font-bold text-ink">{body}</div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import type { BattlePublicState, BattleSnapshot } from "@tebak-kata/shared";

// ---------------------------------------------------------------------------
// Phase screens (PRD §18, §23)
// ---------------------------------------------------------------------------

export function LobbyCard({ frame, state }: { frame: BattleSnapshot | null; state: BattlePublicState | null }) {
  const next = frame?.phaseTimeLeft;
  const queued = (frame?.teams.A.queued ?? 0) + (frame?.teams.B.queued ?? 0);
  return (
    <div className="absolute inset-x-[262px] top-[760px] z-20 animate-drop-in rounded-3xl border-4 border-[#F5C542] bg-[#0B1426]/95 px-6 py-7 text-center shadow-2xl">
      <div className="font-display text-[22px] uppercase tracking-widest text-[#F5C542]">Battle #{state?.matchNumber ?? 1}</div>
      <div className="mt-2 font-display text-[44px] uppercase leading-none">
        {next !== null && next !== undefined ? `Mulai ${next} dtk` : "Segera dimulai"}
      </div>
      <div className="mt-4 text-[24px] font-bold leading-snug">Kirim gift untuk memanggil pasukan!</div>
      <div className="mt-2 text-[19px] font-medium leading-snug text-white/80">
        Gift menentukan tim & hero — bebas bantu tim mana saja. Lihat daftar gift di samping.
      </div>
      {queued > 0 && (
        <div className="mt-4 inline-block rounded-full bg-[#F5C542] px-5 py-1.5 text-[20px] font-black text-[#0B1426]">
          {queued} pasukan siap bertempur
        </div>
      )}
    </div>
  );
}

export function CountdownCard({ seconds }: { seconds: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
      <div
        key={seconds}
        className="animate-stamp font-display text-[300px] leading-none text-[#FFE08A] drop-shadow-[0_10px_0_rgba(0,0,0,0.7)]"
      >
        {Math.max(1, seconds)}
      </div>
    </div>
  );
}

/** Shows "BATTLE!" for a moment when the countdown hands over to the fight. */
export function BattleStartFlash({ status }: { status: string }) {
  const [show, setShow] = useState(false);
  const prev = useRef(status);
  useEffect(() => {
    if (prev.current === "COUNTDOWN" && status === "BATTLE") {
      setShow(true);
      const t = setTimeout(() => setShow(false), 1300);
      prev.current = status;
      return () => clearTimeout(t);
    }
    prev.current = status;
  }, [status]);
  if (!show) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
      <div className="animate-stamp font-display text-[150px] uppercase leading-none text-[#FFE08A] drop-shadow-[0_10px_0_rgba(0,0,0,0.7)]">
        Battle!
      </div>
    </div>
  );
}

export function SuddenDeathBadge() {
  return (
    <div className="absolute inset-x-0 top-[200px] z-20 flex justify-center">
      <div className="animate-pop-in rounded-full border-4 border-[#FF5A4A] bg-[#3A0808]/90 px-8 py-2 font-display text-[34px] uppercase text-[#FFB3A8] shadow-xl">
        💀 Sudden Death · Base ×2
      </div>
    </div>
  );
}

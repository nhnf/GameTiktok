/** Big idle card shown before a game has content. */
export function WaitingCard({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="-rotate-2 rounded-nb border-6 border-ink bg-white px-12 py-8 text-center shadow-nb-xl">
      <div className="font-display text-[64px] uppercase leading-none">{title}</div>
      <div className="mt-3 text-[30px] font-bold">{subtitle}</div>
    </div>
  );
}

/** Covers the stage while the host pauses the session. */
export function PausedOverlay() {
  return (
    <div className="bg-stripes absolute inset-0 z-20 flex items-center justify-center bg-paper/70">
      <div className="-rotate-2 rounded-nb border-6 border-ink bg-white px-12 py-8 text-center shadow-nb-xl">
        <div className="font-display text-[88px] uppercase leading-none">⏸ Jeda dulu!</div>
        <div className="mt-3 text-[30px] font-bold">Host sedang menjeda permainan</div>
      </div>
    </div>
  );
}

/** Shown while the overlay socket reconnects. */
export function ConnectionRibbon() {
  return (
    <div className="absolute inset-x-0 top-[280px] z-30 flex justify-center">
      <div className="bg-hazard rounded-nb border-5 border-ink p-2 shadow-nb-md">
        <div className="rounded-nb-sm bg-ink px-6 py-2 font-display text-[28px] uppercase leading-none text-yellow">⚠ Menyambung ulang...</div>
      </div>
    </div>
  );
}

/** Hazard-striped boss banner (Tebak Kata / Susun Kata). */
export function BossRibbon({ text, reducedMotion, size = "lg" }: { text: string; reducedMotion: boolean; size?: "md" | "lg" }) {
  return (
    <div className={`bg-hazard w-full rounded-nb border-ink shadow-nb-lg ${size === "lg" ? "border-5 p-2" : "border-4 p-1.5"} ${reducedMotion ? "" : "animate-hazard-scroll"}`}>
      <div
        className={`flex items-center justify-center gap-4 rounded-nb-sm border-ink bg-purple font-display uppercase leading-none text-ink ${
          size === "lg" ? "border-3 py-2 text-[44px]" : "border-2 py-1.5 text-[32px]"
        }`}
      >
        <span aria-hidden>👑</span>
        {text}
        <span aria-hidden>👑</span>
      </div>
    </div>
  );
}

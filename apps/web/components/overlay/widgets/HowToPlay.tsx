"use client";

import { useEffect, useState } from "react";

export interface HowToStep {
  icon: string;
  title: string;
  body: string;
  tone: string;
}

const DEFAULT_STEPS: HowToStep[] = [
  { icon: "🏷️", title: "Lihat kategorinya", body: "Kategori jadi petunjuk awal kata yang dicari.", tone: "bg-blue" },
  { icon: "💬", title: "Tebak di komentar", body: "Ketik kata tebakanmu langsung di kolom komentar.", tone: "bg-yellow" },
  { icon: "🔓", title: "Huruf awal terbuka", body: "Huruf yang cocok dari depan langsung terbuka. Tebak lengkap = poin!", tone: "bg-green" },
];

const STEP_MS = 3500;

/** PLAN E4 — idle "attract mode": new viewers understand the game in under 3 seconds. */
export function HowToPlay({
  reducedMotion,
  steps = DEFAULT_STEPS,
  footer = "Game segera dimulai — siapkan tebakanmu!",
}: {
  reducedMotion: boolean;
  steps?: HowToStep[];
  footer?: string;
}) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((current) => (current + 1) % steps.length), STEP_MS);
    return () => clearInterval(id);
  }, [steps.length]);

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="rotate-2 rounded-nb border-5 border-ink bg-ink px-8 py-3 shadow-nb-lg">
        <span className="font-display text-[48px] uppercase leading-none text-yellow">Cara main</span>
      </div>

      <div className="flex w-full flex-col gap-6">
        {steps.map((step, index) => {
          const isActive = index === active;
          return (
            <div
              key={step.title}
              className={`flex items-center gap-6 rounded-nb border-5 border-ink p-5 transition-transform duration-200 ${isActive ? `${step.tone} shadow-nb-xl` : "bg-white shadow-nb-md"}`}
              style={{ transform: isActive && !reducedMotion ? "translateX(-8px) rotate(-1deg)" : undefined }}
            >
              <span className="flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-nb border-5 border-ink bg-white font-display text-[44px] leading-none text-ink">
                {index + 1}
              </span>
              <div className="min-w-0">
                <div className="font-display text-[40px] uppercase leading-tight text-ink">
                  <span aria-hidden>{step.icon} </span>
                  {step.title}
                </div>
                <div className="text-[26px] font-medium leading-snug text-ink">{step.body}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="-rotate-1 rounded-nb border-5 border-ink bg-white px-6 py-3 text-[28px] font-bold text-ink shadow-nb-md">
        {footer}
      </div>
    </div>
  );
}

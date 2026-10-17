"use client";

import type { ChatMessageView } from "@tebak-kata/shared";
import { useNow } from "@/lib/useNow";

const WINDOW_MS = 4000;
const LABELS = ["Ayo tebak!", "Mulai rame", "Rame!", "Panas!", "Makin panas!", "Meledak!"];
const SEGMENT_TONES = ["bg-green", "bg-yellow", "bg-orange", "bg-red", "bg-pink"];

/** PLAN E3 — segmented "chat heat" meter. Pure feedback, never scoring. */
export function GuessHeat({ chatLog }: { chatLog: ChatMessageView[] }) {
  const now = useNow(500);
  const recent = chatLog.filter((message) => now - Date.parse(message.createdAt) < WINDOW_MS).length;
  const level = Math.min(SEGMENT_TONES.length, Math.ceil(recent / 2));

  return (
    <div className="flex w-full items-center gap-4" aria-label={`Keramaian chat: ${LABELS[level]}`}>
      <span className="w-[300px] shrink-0 whitespace-nowrap rounded-nb border-5 border-ink bg-white px-4 py-2.5 text-center font-display text-[26px] uppercase leading-none text-ink shadow-nb-md">
        🔥 {LABELS[level]}
      </span>
      <div className="flex h-[56px] flex-1 gap-2 rounded-nb border-5 border-ink bg-white p-1.5 shadow-nb-md">
        {SEGMENT_TONES.map((tone, index) => (
          <div
            key={tone}
            className={`flex-1 rounded-sm border-2 border-ink transition-colors duration-200 ${index < level ? tone : "bg-paper-deep"}`}
          />
        ))}
      </div>
    </div>
  );
}

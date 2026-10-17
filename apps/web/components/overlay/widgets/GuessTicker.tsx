"use client";

import { normalizeGuess, type ChatMessageView } from "@tebak-kata/shared";
import { useNow } from "@/lib/useNow";

const FRESH_MS = 30_000;
const MAX_CHARS = 10;

interface GuessTickerProps {
  chatLog: ChatMessageView[];
  reducedMotion: boolean;
  maxItems?: number;
}

/**
 * Shows the latest comments/guesses stacked vertically (kebawah)
 * with large, readable typography matching the Top scoreboard.
 */
export function GuessTicker({
  chatLog,
  reducedMotion,
  maxItems = 8,
}: GuessTickerProps) {
  const now = useNow(1000);
  const items = chatLog
    .filter((message) => now - Date.parse(message.createdAt) < FRESH_MS)
    .slice(0, maxItems);

  return (
    <div className="w-full overflow-hidden rounded-nb border-5 border-ink bg-white shadow-nb-lg">
      <div className="flex items-center justify-between bg-ink px-4 py-2.5">
        <span className="font-display text-[28px] uppercase leading-none text-yellow">
          💬 Tebakan Chat
        </span>
        <span className="text-[18px] font-bold uppercase tracking-wider text-white/80">
          Live
        </span>
      </div>

      {items.length === 0 ? (
        <div className="border-t-3 border-ink px-4 py-8 text-center text-[24px] font-bold text-ink">
          Belum ada tebakan — kamu duluan!
        </div>
      ) : (
        items.map((message) => (
          <GuessRow key={message.id} message={message} animate={!reducedMotion} />
        ))
      )}
    </div>
  );
}

function GuessRow({ message, animate }: { message: ChatMessageView; animate: boolean }) {
  const guess = normalizeGuess(message.rawComment);
  const shown = guess.length > MAX_CHARS ? `${guess.slice(0, MAX_CHARS)}…` : guess;
  // Only Tebak Kata reports a matched prefix; other games carry a verdict instead.
  const matched = message.status ? 0 : Math.min(message.matchedLength, guess.length, MAX_CHARS);
  const won = message.isWinner || message.status === "CORRECT";
  const isAlreadyFound = message.status === "ALREADY_FOUND";
  const joined = message.status === "JOINED";

  return (
    <div
      className={`flex h-[62px] items-center justify-between gap-3 border-t-2 border-ink/40 px-3.5 transition-colors ${
        won ? "bg-green/40" : isAlreadyFound ? "bg-yellow/20" : "bg-white"
      } ${animate ? "animate-pop-in" : ""}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <span className="truncate text-[25px] font-bold text-ink">
          @{message.username}
        </span>
        {message.streak && message.streak >= 2 ? (
          <span className="shrink-0 rounded-full border-2 border-ink bg-orange px-1.5 py-0.5 font-display text-[12px] font-black text-white shadow-sm">
            🔥 {message.streak}x
          </span>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="whitespace-nowrap font-mono text-[25px] font-bold leading-none text-ink">
          {matched > 0 && !won && (
            <span className="rounded bg-green px-1 text-ink">{shown.slice(0, matched)}</span>
          )}
          {won ? shown : shown.slice(matched)}
        </span>

        {won && (
          <span className="shrink-0 rounded-full border-2 border-ink bg-green px-2 py-0.5 font-display text-[15px] uppercase leading-none text-ink">
            ✓ Benar{message.points ? ` +${message.points}` : ""}
          </span>
        )}
        {joined && (
          <span className={`shrink-0 rounded-full border-2 border-ink px-2 py-0.5 font-display text-[15px] uppercase leading-none text-ink ${message.team === "RED" ? "bg-[#fca5a5]" : "bg-[#93c5fd]"}`}>
            {message.team === "RED" ? "Tim Merah" : "Tim Biru"}
          </span>
        )}
      </div>
    </div>
  );
}

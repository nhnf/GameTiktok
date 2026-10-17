import type { GameType } from "@tebak-kata/shared";

const CTA_TEXT: Record<GameType, string> = {
  TEBAK_KATA: "Tebak di komentar!",
  TEKA_KATA: "Tebak kata di komentar!",
  MATEMATIKA: "Jawab di komentar!",
  MATEMATIKA_BATTLE: "Ketik BIRU/MERAH, lalu jawab!",
  AUTO_BATTLE: "Kirim gift untuk bertarung!",
};

/** PLAN §6.2 / E1 — the comment call-to-action must always be readable; wiggles every 3s. */
export function CommentCTA({ reducedMotion = false, gameType = "TEBAK_KATA" }: { reducedMotion?: boolean; gameType?: GameType }) {
  const text = CTA_TEXT[gameType];
  // Long texts get a smaller font so the whole sticker always fits the 936px stage.
  const fontSize = text.length > 26 ? 32 : text.length > 20 ? 36 : 40;

  return (
    <div className={`max-w-full ${reducedMotion ? "" : "animate-wiggle"}`}>
      <div className="flex max-w-full items-center justify-center gap-5 rounded-nb border-6 border-ink bg-yellow py-4 pl-7 pr-4 shadow-nb-xl">
        <span aria-hidden className="shrink-0 text-[52px] leading-none">
          💬
        </span>
        <span className="min-w-0 whitespace-nowrap font-display uppercase leading-none text-ink" style={{ fontSize }}>
          {text}
        </span>
        <span
          aria-hidden
          className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full border-5 border-ink bg-ink font-display text-[40px] leading-none text-yellow"
        >
          ⬇
        </span>
      </div>
    </div>
  );
}

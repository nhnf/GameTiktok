import type { Difficulty } from "@tebak-kata/shared";

type BadgeSize = "sm" | "md" | "lg" | "xl";

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "EASY",
  medium: "MEDIUM",
  hard: "HARD",
  boss: "BOSS",
};

// Design System v2.0 §4.1 — semantic difficulty colors, ink text on every fill.
const DIFFICULTY_TONE: Record<Difficulty, string> = {
  easy: "bg-green",
  medium: "bg-orange",
  hard: "bg-red",
  boss: "bg-purple",
};

const DIFFICULTY_SIZE: Record<BadgeSize, string> = {
  sm: "h-7 gap-1.5 px-2.5 text-[11px] border-2 shadow-nb-sm",
  md: "h-11 gap-2.5 px-4 text-[18px] border-3 shadow-nb-sm",
  lg: "h-[74px] gap-3.5 px-7 text-[32px] border-5 shadow-nb-md",
  xl: "h-[86px] gap-4 px-8 text-[38px] border-6 shadow-nb-lg",
};

export function DifficultyBadge({
  difficulty,
  size = "md",
}: {
  difficulty: Difficulty;
  size?: BadgeSize;
}) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border-ink font-bold uppercase tracking-wide text-ink ${
        DIFFICULTY_TONE[difficulty] ?? "bg-paper"
      } ${DIFFICULTY_SIZE[size]}`}
    >
      <span aria-hidden>{difficulty === "boss" ? "👑" : "●"}</span>
      {DIFFICULTY_LABEL[difficulty] ?? String(difficulty).toUpperCase()}
    </span>
  );
}

const CATEGORY_SIZE: Record<BadgeSize, { wrap: string; icon: string }> = {
  sm: { wrap: "h-8 gap-2 pl-1 pr-3 text-xs border-2 shadow-nb-sm", icon: "h-6 w-6 text-sm border-2" },
  md: { wrap: "h-11 gap-2.5 pl-1.5 pr-4 text-[18px] border-3 shadow-nb-sm", icon: "h-8 w-8 text-base border-2" },
  lg: { wrap: "h-[74px] gap-4 pl-2 pr-7 text-[34px] border-5 shadow-nb-lg", icon: "h-14 w-14 text-[32px] border-3" },
  xl: { wrap: "h-[88px] gap-5 pl-2.5 pr-9 text-[42px] border-6 shadow-nb-xl", icon: "h-16 w-16 text-[38px] border-4" },
};

/** Category sticker — tells the category only, never an extra hint (Design System §11). */
export function CategoryBadge({
  name,
  emoji,
  size = "md",
}: {
  name: string;
  emoji: string;
  size?: BadgeSize;
}) {
  const s = CATEGORY_SIZE[size];
  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full border-ink bg-blue font-display uppercase text-ink ${s.wrap}`}
    >
      <span
        aria-hidden
        className={`flex shrink-0 items-center justify-center rounded-full border-ink bg-white leading-none ${s.icon}`}
      >
        {emoji}
      </span>
      <span className="truncate leading-none">{name}</span>
    </span>
  );
}

export function Badge({
  tone = "yellow",
  children,
}: {
  tone?: "yellow" | "green" | "blue" | "purple" | "pink" | "red" | "paper";
  children: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    yellow: "bg-yellow",
    green: "bg-green",
    blue: "bg-blue",
    purple: "bg-purple",
    pink: "bg-pink",
    red: "bg-red",
    paper: "bg-paper",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border-2 border-ink px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-ink shadow-nb-sm ${
        tones[tone] || "bg-yellow"
      }`}
    >
      {children}
    </span>
  );
}

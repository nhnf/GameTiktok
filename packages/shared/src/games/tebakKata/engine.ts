/**
 * Pure, side-effect-free game engine primitives.
 * Mirrors PRD_Tebak_Kata_Live_TikTok.md sections 6, 7, 8, 10, 11, 13, 20, 30.
 *
 * These functions never touch the network or a database — they are the
 * authoritative rules the server applies to every incoming comment/gift.
 */
import type { Difficulty, ScoringConfig, WordRecord } from "./types.js";

/**
 * PRD section 10 — Comment Normalization.
 * uppercase, trim, strip irrelevant punctuation, collapse whitespace.
 */
export function normalizeGuess(raw: string): string {
  if (typeof raw !== "string") return "";
  return raw
    .normalize("NFKC")
    .replace(/[−–]/g, "-")
    .toUpperCase()
    .replace(/[^\p{L}\p{N}\s\-]/gu, "") // strip punctuation (keep letters/digits/spaces/hyphen)
    .replace(/\s+/g, "")
    .trim();
}

/**
 * PRD section 6.1 — Prefix Matching.
 * Longest common prefix between guess and target, comparing from index 0
 * and stopping at the first mismatch. A guess longer than the target can
 * never match past the target's length.
 */
export function longestCommonPrefixLength(target: string, guess: string): number {
  const max = Math.min(target.length, guess.length);
  let i = 0;
  while (i < max && target[i] === guess[i]) i++;
  return i;
}

export interface GuessEvaluation {
  normalized: string;
  matchedLength: number;
  /** True only when normalized guess === target exactly (PRD section 8). */
  isFullMatch: boolean;
  /**
   * True when this guess extends the previously revealed prefix further
   * than before. Reveal is monotonic — it never shrinks (PRD section 11:
   * duplicate/no-progress guesses must not change state or emit events).
   */
  revealAdvanced: boolean;
  /** New revealed-length the puzzle should adopt (never less than current). */
  newRevealedLength: number;
}

/**
 * Evaluate a single normalized guess against the target word and the
 * puzzle's currently revealed prefix length.
 *
 * @param target already-normalized target word (uppercase, no punctuation)
 * @param currentRevealedLength number of letters already revealed (from the left)
 * @param rawGuess raw comment text, not yet normalized
 */
export function evaluateGuess(
  target: string,
  currentRevealedLength: number,
  rawGuess: string,
): GuessEvaluation {
  const normalized = normalizeGuess(rawGuess);
  const matchedLength = normalized.length === 0 ? 0 : longestCommonPrefixLength(target, normalized);
  const isFullMatch = normalized === target;
  const newRevealedLength = Math.max(currentRevealedLength, matchedLength);
  const revealAdvanced = newRevealedLength > currentRevealedLength;

  return { normalized, matchedLength, isFullMatch, revealAdvanced, newRevealedLength };
}

/**
 * Checks if a target word is fully revealed on display.
 * Since first (index 0) and last (index target.length - 1) letters are always revealed as hints,
 * the word is fully visible when the prefix reveal reaches target.length - 1 (or target.length for len <= 2).
 */
export function isFullyRevealed(target: string, revealedLength: number): boolean {
  if (target.length <= 2) return revealedLength >= target.length;
  return revealedLength >= target.length - 1;
}

/**
 * Reveal next hidden letter from left to right.
 */
export function revealNextLetter(target: string, currentRevealedLength: number): number {
  if (target.length <= 2) return Math.min(target.length, currentRevealedLength + 1);
  return Math.min(target.length - 1, Math.max(1, currentRevealedLength + 1));
}

/**
 * Build the display array:
 * First letter (index 0) and last letter (index target.length - 1) are always revealed as hints.
 * Intermediate positions are revealed when index < revealedLength.
 */
export function buildDisplay(target: string, revealedLength: number): (string | null)[] {
  const len = target.length;
  if (len === 0) return [];
  if (len === 1) return [target[0]];

  return target.split("").map((letter, index) => {
    // First letter and last letter are always visible as hints
    if (index === 0 || index === len - 1) {
      return letter;
    }
    // Intermediate letters revealed by guess prefix / hint / gift
    if (index < revealedLength) {
      return letter;
    }
    return null;
  });
}

/** PRD section 13.2 — points for a difficulty, using session-configured scoring. */
export function scoreForDifficulty(difficulty: Difficulty, scoring: ScoringConfig): number {
  return scoring[difficulty];
}

/** PRD section 20 — Boss Round is triggered by solved-word count, not rounds. */
export function shouldTriggerBoss(wordsSolvedSinceLastBoss: number, bossEveryNWords: number): boolean {
  return wordsSolvedSinceLastBoss >= bossEveryNWords;
}

export interface WordSelectionOptions {
  difficulty: Difficulty;
  /** ids used in the current cycle. */
  usedWordIds?: ReadonlySet<string>;
  recentWordIds?: readonly string[];
  antiRepeatWindow?: number;
  random?: () => number;
}

/**
 * Word Selection + Anti-Repetition.
 * Picks an active word matching difficulty that hasn't appeared yet in the current cycle.
 * Falls back to all active words when the entire pool has been exhausted.
 */
export function selectNextWord(words: readonly WordRecord[], options: WordSelectionOptions): WordRecord | null {
  const { difficulty, usedWordIds, recentWordIds, antiRepeatWindow, random = Math.random } = options;

  const active = words.filter((w) => w.isActive && w.difficulty === difficulty);
  if (active.length === 0) return null;

  const usedSet = usedWordIds ?? new Set(recentWordIds ? recentWordIds.slice(-(antiRepeatWindow ?? active.length)) : []);

  const fresh = active.filter((w) => !usedSet.has(w.id));
  const pool = fresh.length > 0 ? fresh : active;

  const index = Math.floor(random() * pool.length);
  return pool[Math.min(index, pool.length - 1)];
}

/**
 * Picks the next word for a puzzle, never failing while any active word
 * exists: the requested difficulty first (fresh words before repeats), then
 * any other difficulty. `usedWordIds` is mutated so a full cycle through the
 * pool happens before a word repeats.
 */
export function pickNextWord(
  words: readonly WordRecord[],
  difficulty: Difficulty,
  usedWordIds: Set<string>,
  random: () => number = Math.random,
): WordRecord | null {
  const active = words.filter((w) => w.isActive);
  if (active.length === 0) return null;
  const sameDifficulty = active.filter((w) => w.difficulty === difficulty);
  const pool = sameDifficulty.length > 0 ? sameDifficulty : active;

  // Whole pool already seen → start a new cycle for this pool.
  if (pool.every((w) => usedWordIds.has(w.id))) {
    for (const w of pool) usedWordIds.delete(w.id);
  }
  const fresh = pool.filter((w) => !usedWordIds.has(w.id));
  const candidates = fresh.length > 0 ? fresh : pool;
  const word = candidates[Math.min(Math.floor(random() * candidates.length), candidates.length - 1)];
  usedWordIds.add(word.id);
  return word;
}

/** Display string persisted in the DB ("K___S"). */
export function displayStateString(target: string, revealedLength: number): string {
  return buildDisplay(target, revealedLength)
    .map((c) => c ?? "_")
    .join("");
}

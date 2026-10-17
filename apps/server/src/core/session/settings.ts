import {
  DEFAULT_ANTI_REPEAT_WINDOW,
  DEFAULT_BOSS_EVERY_N_WORDS,
  DEFAULT_GIFT_GOAL_COINS,
  DEFAULT_LIVE_TIMER,
  DEFAULT_MATH_CONFIG,
  DEFAULT_SCORING,
  DEFAULT_TEKA_KATA_CONFIG,
  isGameType,
  type SessionSettings,
} from "@tebak-kata/shared";

export function defaultSessionSettings(): SessionSettings {
  return {
    scoring: { ...DEFAULT_SCORING },
    bossEveryNWords: DEFAULT_BOSS_EVERY_N_WORDS,
    antiRepeatWindow: DEFAULT_ANTI_REPEAT_WINDOW,
    mockTikTokEnabled: true,
    activeGame: "TEBAK_KATA",
    tekaKata: { ...DEFAULT_TEKA_KATA_CONFIG },
    matematika: { ...DEFAULT_MATH_CONFIG },
    liveTimer: { ...DEFAULT_LIVE_TIMER },
    giftGoalCoins: DEFAULT_GIFT_GOAL_COINS,
  };
}

/**
 * Merges a partial update into settings. Nested game configs are merged
 * key by key, so updating one field never wipes the others.
 */
export function mergeSettings(base: SessionSettings, partial: Partial<SessionSettings> | null | undefined): SessionSettings {
  if (!partial) return base;
  const merged: SessionSettings = {
    ...base,
    ...stripUndefined(partial),
    scoring: { ...base.scoring, ...(partial.scoring ?? {}) },
    tekaKata: { ...base.tekaKata, ...(partial.tekaKata ?? {}) },
    matematika: { ...base.matematika, ...(partial.matematika ?? {}) },
    liveTimer: { ...DEFAULT_LIVE_TIMER, ...base.liveTimer, ...(partial.liveTimer ?? {}) },
  };
  // Tarik Tambang keeps its own config table (Admin/host saves it there).
  delete merged.mathBattle;
  if (!isGameType(merged.activeGame)) merged.activeGame = base.activeGame ?? "TEBAK_KATA";
  return merged;
}

function stripUndefined<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Partial<T>;
}

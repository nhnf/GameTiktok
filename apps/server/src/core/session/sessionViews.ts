import type {
  ChampionEntry,
  GameStateHost,
  GameStatePublic,
  GameType,
  GiftGoalState,
  LeaderboardEntry,
  LiveSessionTimer,
  SessionProgress,
  SessionSettings,
  SessionStatus,
  SessionSummary,
} from "@tebak-kata/shared";
import type { GameAdapters } from "../../games/registry.js";

export interface SessionSnapshot {
  sessionId: string | null;
  status: SessionStatus;
  activeGame: GameType;
  settings: SessionSettings;
  leaderboard: LeaderboardEntry[];
  timer: LiveSessionTimer | null;
  giftGoal: GiftGoalState;
  champions: ChampionEntry[];
  lastSessionSummary: SessionSummary | null;
  stats: { totalPlayers: number; totalComments: number; totalValidGuesses: number; totalGifts: number };
  liveSource: GameStateHost["liveSource"];
}

/** Progress counters from every game module, merged into one object. */
export function collectProgress(games: GameAdapters): SessionProgress {
  const base: SessionProgress = { wordsFound: 0, wordsSkipped: 0, bossesDefeated: 0, wordsUntilNextBoss: 0 };
  return Object.values(games).reduce<SessionProgress>((acc, game) => ({ ...acc, ...game.getProgress() }), base);
}

export function buildPublicState(s: SessionSnapshot, games: GameAdapters): GameStatePublic {
  return {
    sessionId: s.sessionId,
    status: s.status,
    activeGame: s.activeGame,
    puzzle: games.TEBAK_KATA.getPublicState(),
    tekaKataPuzzle: games.TEKA_KATA.getPublicState(),
    mathQuestion: games.MATEMATIKA.getPublicState(),
    battle: games.AUTO_BATTLE.getPublicState(),
    mathBattle: games.MATEMATIKA_BATTLE.getPublicState(),
    leaderboard: s.leaderboard,
    progress: collectProgress(games),
    timer: s.timer,
    giftGoal: s.giftGoal,
    champions: s.champions,
    settings: {
      scoring: s.settings.scoring,
      bossEveryNWords: s.settings.bossEveryNWords,
      activeGame: s.activeGame,
      tekaKata: s.settings.tekaKata,
      matematika: s.settings.matematika,
      mathBattle: games.MATEMATIKA_BATTLE.getConfig(),
      liveTimer: s.settings.liveTimer,
    },
    lastSessionSummary: s.lastSessionSummary,
  };
}

export function buildHostState(s: SessionSnapshot, games: GameAdapters): GameStateHost {
  return {
    sessionId: s.sessionId,
    status: s.status,
    activeGame: s.activeGame,
    puzzle: games.TEBAK_KATA.getHostState(),
    tekaKataPuzzle: games.TEKA_KATA.getHostState(),
    mathQuestion: games.MATEMATIKA.getHostState(),
    battle: games.AUTO_BATTLE.getHostState(),
    mathBattle: games.MATEMATIKA_BATTLE.getHostState(),
    leaderboard: s.leaderboard,
    progress: collectProgress(games),
    timer: s.timer,
    giftGoal: s.giftGoal,
    champions: s.champions,
    settings: s.settings,
    lastSessionSummary: s.lastSessionSummary,
    stats: s.stats,
    liveSource: s.liveSource,
  };
}

export function buildSummary(sessionId: string, s: SessionSnapshot, progress: SessionProgress): SessionSummary {
  return {
    sessionId,
    activeGame: s.activeGame,
    totalPlayers: s.stats.totalPlayers,
    totalComments: s.stats.totalComments,
    totalValidGuesses: s.stats.totalValidGuesses,
    totalGifts: s.stats.totalGifts,
    wordsSolved: progress.wordsFound,
    wordsSkipped: progress.wordsSkipped,
    bossesDefeated: progress.bossesDefeated,
    tekaKataPuzzlesCompleted: progress.tekaKataPuzzlesCompleted,
    tekaKataWordsFound: progress.tekaKataWordsFound,
    mathQuestionsCompleted: progress.mathQuestionsCompleted,
    mathAnswersCount: progress.mathAnswersCount,
    mathBattleMatchesCompleted: progress.mathBattleMatchesCompleted,
    mathBattleRoundsCompleted: progress.mathBattleRoundsCompleted,
    topPlayer: s.leaderboard[0] ?? null,
    leaderboard: s.leaderboard,
  };
}

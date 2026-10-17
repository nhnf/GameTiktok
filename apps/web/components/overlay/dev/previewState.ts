import { DEFAULT_SCORING, type Category, type Difficulty, type GameStatePublic, type LeaderboardEntry, type SessionStatus } from "@tebak-kata/shared";

interface PreviewInput {
  status: SessionStatus;
  wordIndex: number;
  isBoss: boolean;
  category: Category;
  difficulty: Difficulty;
  target: string;
  solved: boolean;
  revealed: number;
  reward: number;
  leaderboard: LeaderboardEntry[];
  wordsFound: number;
}

/** Fake public state for the overlay preview (Tebak Kata). */
export function buildPreviewState({ status, wordIndex, isBoss, category, difficulty, target, solved, revealed, reward, leaderboard, wordsFound }: PreviewInput): GameStatePublic {
  return {
      sessionId: "preview",
      status,
      activeGame: "TEBAK_KATA",
      puzzle:
        status === "CREATED"
          ? null
          : {
              puzzleId: `${wordIndex}-${isBoss ? "boss" : "normal"}`,
              category: category,
              difficulty,
              isBoss,
              wordLength: target.length,
              display: target.split("").map((letter, index) => (solved || index < revealed ? letter : null)),
              revealedLength: solved ? target.length : revealed,
              status: solved ? "SOLVED" : "ACTIVE",
              winner: null,
              rewardPoints: reward,
            },
      tekaKataPuzzle: null,
      mathQuestion: null,
      battle: null,
      mathBattle: null,
      leaderboard: status === "CREATED" ? [] : leaderboard,
      progress: { wordsFound, wordsSkipped: 3, bossesDefeated: 1, wordsUntilNextBoss: 3 },
      timer: null,
      settings: { scoring: DEFAULT_SCORING, bossEveryNWords: 10 },
      lastSessionSummary:
        status === "ENDED"
          ? {
              sessionId: "preview",
              totalPlayers: 128,
              totalComments: 8421,
              totalValidGuesses: 5120,
              wordsSolved: wordsFound,
              wordsSkipped: 3,
              bossesDefeated: 1,
              topPlayer: leaderboard[0] ?? null,
            }
          : null,
    };
}

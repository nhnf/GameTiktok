import type { GameStateHost, GameStatePublic, ServerEvent } from "@tebak-kata/shared";
import { patchTebakPuzzle } from "@/games/tebakKata/stateReducer";
import { patchTekaPuzzle } from "@/games/tekaKata/stateReducer";
import { patchMathQuestion } from "@/games/matematika/stateReducer";

/**
 * Keeps client state current between full SESSION_STATE snapshots. The
 * server sends a full snapshot after every meaningful change, so these
 * patches only need to cover the in-between events (letters, chat...).
 */
function applyShared<T extends GameStatePublic | GameStateHost>(prev: T, event: ServerEvent): T {
  switch (event.type) {
    case "GAME_CHANGED":
      return { ...prev, activeGame: event.payload.gameType };
    case "LEADERBOARD_UPDATED":
      return { ...prev, leaderboard: event.payload.leaderboard };
    case "SESSION_PAUSED":
      return { ...prev, status: "PAUSED" };
    case "SESSION_RESUMED":
      return { ...prev, status: "ACTIVE" };
    case "SESSION_ENDED":
      return { ...prev, status: "ENDED", lastSessionSummary: event.payload.summary };
    default:
      break;
  }
  if (event.type === "LETTER_REVEALED") return { ...prev, puzzle: patchTebakPuzzle(prev.puzzle, event) };
  if (event.type.startsWith("TK_")) return { ...prev, tekaKataPuzzle: patchTekaPuzzle(prev.tekaKataPuzzle, event) };
  if (event.type.startsWith("MATH_") && !event.type.startsWith("MATH_BATTLE_")) {
    return { ...prev, mathQuestion: patchMathQuestion(prev.mathQuestion, event) };
  }
  return prev;
}

export function applyPublicEvent(prev: GameStatePublic | null, event: ServerEvent): GameStatePublic | null {
  if (event.type === "SESSION_STATE") return event.payload;
  return prev ? applyShared(prev, event) : prev;
}

export function applyHostEvent(prev: GameStateHost | null, event: ServerEvent): GameStateHost | null {
  if (event.type === "SESSION_STATE_HOST") return event.payload;
  return prev ? applyShared(prev, event) : prev;
}

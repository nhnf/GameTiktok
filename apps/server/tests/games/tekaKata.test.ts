import { describe, expect, it } from "vitest";
import { GameSessionManager } from "../../src/core/session/sessionManager.js";
import { Broadcaster } from "../../src/core/realtime/broadcaster.js";
import { prisma } from "../../src/core/db.js";

describe("Susun Kata", () => {
  it("first correct claim scores and is persisted; a repeat claim scores nothing", async () => {
    const manager = new GameSessionManager(new Broadcaster());
    await manager.startSession({ activeGame: "TEKA_KATA", tekaKata: { difficulty: "random", autoGenerateNext: false } });
    const puzzle = manager.getHostState().tekaKataPuzzle!;
    expect(puzzle.status).toBe("ACTIVE");
    const word = puzzle.words[0];

    await manager.handleComment({ platformUserId: "a", username: "andi", rawComment: word.word.toLowerCase() });
    await manager.handleComment({ platformUserId: "b", username: "budi", rawComment: word.word });

    const after = manager.getHostState();
    expect(after.tekaKataPuzzle!.words[0].foundBy?.username).toBe("andi");
    expect(after.leaderboard.map((e) => e.username)).toEqual(["andi"]);
    // Viewers never receive letters of words nobody found yet.
    const pub = manager.getPublicState().tekaKataPuzzle!;
    expect(pub.words.filter((w) => !w.isFound && !w.isRevealed).every((w) => w.word === undefined)).toBe(true);

    await new Promise((r) => setTimeout(r, 300)); // async persistence
    const found = await prisma.tekaKataFoundWord.findMany({ where: { puzzleId: puzzle.puzzleId } });
    expect(found).toHaveLength(1);
    await manager.endSession();
  });

  it("revealing every word completes the puzzle; resume after a pause starts the next one", async () => {
    const manager = new GameSessionManager(new Broadcaster());
    await manager.startSession({ activeGame: "TEKA_KATA", tekaKata: { autoGenerateNext: true } });
    const game = manager.getTekaKataAdapter();
    const first = manager.getHostState().tekaKataPuzzle!;
    for (const w of first.words) await game.revealWord(w.id);
    expect(manager.getHostState().tekaKataPuzzle!.status).toBe("COMPLETED");
    await manager.pauseSession();
    await manager.resumeSession();
    const next = manager.getHostState().tekaKataPuzzle!;
    expect(next.puzzleId).not.toBe(first.puzzleId);
    expect(next.status).toBe("ACTIVE");
    await manager.endSession();
  });
});

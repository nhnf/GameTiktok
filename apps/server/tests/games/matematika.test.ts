import { describe, expect, it } from "vitest";
import { GameSessionManager } from "../../src/core/session/sessionManager.js";
import { Broadcaster } from "../../src/core/realtime/broadcaster.js";

describe("Matematika LIVE", () => {
  it("ranks correct answers by speed and hides the answer from viewers", async () => {
    const manager = new GameSessionManager(new Broadcaster());
    await manager.startSession({ activeGame: "MATEMATIKA", matematika: { durationSeconds: 30, operationMode: "addition" } });
    const q = manager.getHostState().mathQuestion!;
    expect(manager.getPublicState().mathQuestion!.revealedAnswer).toBeNull();

    await manager.handleComment({ platformUserId: "a", username: "andi", rawComment: String(q.answer) });
    await manager.handleComment({ platformUserId: "b", username: "budi", rawComment: String(q.answer + 1) });
    await manager.handleComment({ platformUserId: "b", username: "budi", rawComment: " " + q.answer + " " });
    await manager.handleComment({ platformUserId: "a", username: "andi", rawComment: String(q.answer) });

    const after = manager.getHostState().mathQuestion!;
    expect(after.correctAnswers.map((c) => [c.player.username, c.rank])).toEqual([
      ["andi", 1],
      ["budi", 2],
    ]);
    expect(manager.getHostState().leaderboard[0].points).toBe(100);
    await manager.endSession();
  });

  it("pause keeps the remaining answer time instead of restarting it", async () => {
    const manager = new GameSessionManager(new Broadcaster());
    await manager.startSession({ activeGame: "MATEMATIKA", matematika: { durationSeconds: 20 } });
    const before = manager.getHostState().mathQuestion!;
    await manager.pauseSession();
    expect(manager.getPublicState().mathQuestion!.endsAt).toBeNull();
    await manager.resumeSession();
    const after = manager.getHostState().mathQuestion!;
    expect(after.questionId).toBe(before.questionId);
    expect(after.status).toBe("ACTIVE");
    expect(Date.parse(after.endsAt!) - Date.now()).toBeLessThanOrEqual(20_000);
    await manager.endSession();
  });

  it("awards combo streak bonus on consecutive correct answers", async () => {
    const manager = new GameSessionManager(new Broadcaster());
    await manager.startSession({ activeGame: "MATEMATIKA", matematika: { durationSeconds: 30, autoNext: false } });

    // Question 1: andi answers correctly -> rank 1: 100 points, streak 1 (no bonus)
    let q = manager.getHostState().mathQuestion!;
    await manager.handleComment({ platformUserId: "a", username: "andi", rawComment: String(q.answer) });
    let p = manager.getHostState().leaderboard.find((l) => l.userId === "a");
    expect(p?.points).toBe(100);

    // Question 2: generate next question -> andi answers correctly -> rank 1: 100 points, streak 2 (no bonus)
    await manager.getMatematikaAdapter().generateQuestion();
    await manager.getMatematikaAdapter().startQuestion();
    q = manager.getHostState().mathQuestion!;
    await manager.handleComment({ platformUserId: "a", username: "andi", rawComment: String(q.answer) });
    p = manager.getHostState().leaderboard.find((l) => l.userId === "a");
    expect(p?.points).toBe(200); // 100 + 100

    // Question 3: andi answers correctly -> rank 1: 100 points + 20 streak bonus (total 120), streak 3!
    await manager.getMatematikaAdapter().generateQuestion();
    await manager.getMatematikaAdapter().startQuestion();
    q = manager.getHostState().mathQuestion!;
    // Wrong guess first, then right answer: streak still continues to 3!
    await manager.handleComment({ platformUserId: "a", username: "andi", rawComment: String(q.answer + 5) });
    await manager.handleComment({ platformUserId: "a", username: "andi", rawComment: String(q.answer) });
    p = manager.getHostState().leaderboard.find((l) => l.userId === "a");
    expect(p?.points).toBe(320); // 200 + 100 + 20 bonus
    expect(p?.streak).toBe(3);

    // Question 4: question ends (revealAnswer / skip / time up) without andi answering -> streak resets to 0
    await manager.getMatematikaAdapter().generateQuestion();
    await manager.getMatematikaAdapter().startQuestion();
    await manager.getMatematikaAdapter().revealAnswer();
    p = manager.getHostState().leaderboard.find((l) => l.userId === "a");
    expect(p?.streak).toBe(0);

    await manager.endSession();
  });

  it("triggers Boss Round (3x points) when gift goal is achieved", async () => {
    const manager = new GameSessionManager(new Broadcaster());
    await manager.startSession({ activeGame: "MATEMATIKA", matematika: { durationSeconds: 30, autoNext: false } });

    // Send 100 coins gift to fill gift goal
    await manager.handleGift({ platformUserId: "gifter", username: "sultan", giftId: "5657", diamondCount: 100, count: 1 });
    expect(manager.getHostState().giftGoal?.tier).toBe(2);

    // Next generated question must be a Boss Round!
    await manager.getMatematikaAdapter().generateQuestion();
    await manager.getMatematikaAdapter().startQuestion();
    const q = manager.getHostState().mathQuestion!;
    expect(q.isBoss).toBe(true);
    expect(q.pointMultiplier).toBe(3);

    // Winner gets 3x base points: 100 * 3 = 300 points
    await manager.handleComment({ platformUserId: "budi", username: "budi", rawComment: String(q.answer) });
    const budi = manager.getHostState().leaderboard.find((l) => l.userId === "budi");
    expect(budi?.points).toBe(300);

    await manager.endSession();
  });
});

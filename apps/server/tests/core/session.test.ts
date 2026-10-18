import { describe, expect, it } from "vitest";
import { GameSessionManager } from "../../src/core/session/sessionManager.js";
import { Broadcaster } from "../../src/core/realtime/broadcaster.js";

describe("GameSessionManager", () => {
  it("a TikTok combo-end marker (count 0) adds no coins or gifts", async () => {
    const manager = new GameSessionManager(new Broadcaster());
    await manager.startSession({ activeGame: "MATEMATIKA", liveTimer: { enabled: true, initialMinutes: 10, secondsPerCoin: 60 } });
    await manager.handleGift({ platformUserId: "u", username: "u", giftId: "5655", diamondCount: 1, count: 3, comboEnded: false });
    await manager.handleGift({ platformUserId: "u", username: "u", giftId: "5655", diamondCount: 1, count: 0, comboEnded: true });
    const state = manager.getHostState();
    expect(state.stats.totalGifts).toBe(3);
    expect(state.timer?.secondsAddedByGifts).toBe(180);
    await manager.endSession();
  });

  it("refuses a second session and ends cleanly with a summary", async () => {
    const manager = new GameSessionManager(new Broadcaster());
    await manager.startSession({ activeGame: "TEBAK_KATA" });
    await expect(manager.startSession()).rejects.toThrow(/masih berjalan/);
    const target = manager.getHostState().puzzle!.targetWord;
    await manager.handleComment({ platformUserId: "p1", username: "andi", rawComment: target.toLowerCase() });
    const summary = await manager.endSession();
    expect(summary.wordsSolved).toBe(1);
    expect(summary.topPlayer?.username).toBe("andi");
    expect(manager.getStatus()).toBe("ENDED");
    expect(manager.getHostState().timer).toBeNull();
  });

  it("switching game while paused keeps the new game paused and resumable", async () => {
    const manager = new GameSessionManager(new Broadcaster());
    await manager.startSession({ activeGame: "TEBAK_KATA" });
    await manager.pauseSession();
    await manager.switchGame("MATEMATIKA");
    await manager.resumeSession();
    const q = manager.getHostState().mathQuestion;
    expect(q?.status).toBe("ACTIVE");
    await manager.endSession();
  });

  it("handles gift scoring rules (1 coin = 100pts/30s, 30 coins = 3000pts & -100 opponent, 100 coins = reset & 1000pts)", async () => {
    const manager = new GameSessionManager(new Broadcaster());
    await manager.startSession({ activeGame: "MATEMATIKA" });

    // 1. Default liveTimer secondsPerCoin is 30
    expect(manager.getHostState().timer?.secondsPerCoin).toBe(30);

    // 2. 1 coin gift adds 100 points and 30 seconds
    await manager.handleGift({ platformUserId: "p1", username: "player1", giftId: "5655", diamondCount: 1, count: 1 });
    let state = manager.getHostState();
    let p1 = state.leaderboard.find((p) => p.userId === "p1");
    expect(p1?.points).toBe(100);
    expect(state.timer?.secondsAddedByGifts).toBe(30);

    // Multiples: 5 coins adds 500 points and 150 seconds
    await manager.handleGift({ platformUserId: "p1", username: "player1", giftId: "5655", diamondCount: 5, count: 1 });
    state = manager.getHostState();
    p1 = state.leaderboard.find((p) => p.userId === "p1");
    expect(p1?.points).toBe(600); // 100 + 500
    expect(state.timer?.secondsAddedByGifts).toBe(180); // 30 + 150

    // Another player with points
    await manager.handleGift({ platformUserId: "p2", username: "player2", giftId: "5655", diamondCount: 1, count: 5 }); // 500 points
    state = manager.getHostState();
    let p2 = state.leaderboard.find((p) => p.userId === "p2");
    expect(p2?.points).toBe(500);

    // 5. 30 coin gift adds 3000 points to gifter and reduces top opponent's score by 100 points
    await manager.handleGift({ platformUserId: "p2", username: "player2", giftId: "5656", diamondCount: 30, count: 1 });
    state = manager.getHostState();
    p2 = state.leaderboard.find((p) => p.userId === "p2");
    p1 = state.leaderboard.find((p) => p.userId === "p1");
    expect(p2?.points).toBe(3500); // 500 + 3000
    expect(p1?.points).toBe(500); // 600 - 100

    // 3. 100 coin gift resets all scores to 0 and gives 1000 points to gifter
    await manager.handleGift({ platformUserId: "p3", username: "player3", giftId: "5657", diamondCount: 100, count: 1 });
    state = manager.getHostState();
    p1 = state.leaderboard.find((p) => p.userId === "p1");
    p2 = state.leaderboard.find((p) => p.userId === "p2");
    const p3 = state.leaderboard.find((p) => p.userId === "p3");
    expect(p1?.points ?? 0).toBe(0);
    expect(p2?.points ?? 0).toBe(0);
    expect(p3?.points).toBe(1000);

    await manager.endSession();
  });

  it("triggers Boss round in Tebak Kata when gift goal is reached", async () => {
    const manager = new GameSessionManager(new Broadcaster());
    await manager.startSession({ activeGame: "TEBAK_KATA", giftGoalCoins: 40 });

    expect(manager.getHostState().giftGoal?.targetCoins).toBe(40);

    // Send 40 coins gift
    await manager.handleGift({ platformUserId: "p_gift", username: "gifter", giftId: "5655", diamondCount: 40, count: 1 });
    expect(manager.getHostState().giftGoal?.tier).toBe(2);

    // Next puzzle generated must be Boss!
    await manager.getTebakKataAdapter().newPuzzle();
    const puzzle = manager.getHostState().puzzle;
    expect(puzzle?.isBoss).toBe(true);
    expect(puzzle?.difficulty).toBe("boss");

    await manager.endSession();
  });

  it("allows setting timer rate (seconds per coin) while live", async () => {
    const manager = new GameSessionManager(new Broadcaster());
    await manager.startSession({
      activeGame: "TEBAK_KATA",
      liveTimer: { enabled: true, initialMinutes: 10, secondsPerCoin: 10 },
    });

    expect(manager.getHostState().timer?.secondsPerCoin).toBe(10);

    // 1 coin adds 10s initially
    await manager.handleGift({ platformUserId: "u1", username: "u1", giftId: "5655", diamondCount: 1, count: 1 });
    expect(manager.getHostState().timer?.secondsAddedByGifts).toBe(10);

    // Host updates rate live to 60s per coin
    manager.setLiveTimerSecondsPerCoin(60);
    expect(manager.getHostState().timer?.secondsPerCoin).toBe(60);

    // Next 1 coin adds 60s
    await manager.handleGift({ platformUserId: "u2", username: "u2", giftId: "5655", diamondCount: 1, count: 1 });
    expect(manager.getHostState().timer?.secondsAddedByGifts).toBe(70);

    await manager.endSession();
  });
});


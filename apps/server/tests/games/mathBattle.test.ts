import { beforeEach, describe, expect, it } from "vitest";
import { GameSessionManager } from "../../src/core/session/sessionManager.js";
import { Broadcaster } from "../../src/core/realtime/broadcaster.js";

const comment = (platformUserId: string, rawComment: string) => ({ platformUserId, username: platformUserId, rawComment });

describe("Matematika Tarik Tambang (session + adapter)", () => {
  let manager: GameSessionManager;

  beforeEach(async () => {
    manager = new GameSessionManager(new Broadcaster());
    await manager.startSession({ activeGame: "MATEMATIKA_BATTLE", mathBattle: { totalRounds: 5, roundDurationSeconds: 10, winLineDistance: 100 } });
  });

  const adapter = () => manager.getMathBattleAdapter();
  const toRound = async () => {
    await adapter().skipAhead(); // STARTING → round 1
    expect(adapter().getHostState().status).toBe("QUESTION_ACTIVE");
    return adapter().getHostState().round!;
  };

  it("applies per-session overrides and starts a match", () => {
    const state = adapter().getHostState();
    expect(state.config.totalRounds).toBe(5);
    expect(state.status).toBe("STARTING");
    expect(state.matchNumber).toBe(1);
  });

  it("joins teams by comment; numbers never join", async () => {
    await manager.handleComment(comment("u1", "BIRU"));
    await manager.handleComment(comment("u2", "tim merah"));
    await manager.handleComment(comment("u3", "2"));
    const state = adapter().getHostState();
    expect(state.players.find((p) => p.userId === "u1")?.team).toBe("BLUE");
    expect(state.players.find((p) => p.userId === "u2")?.team).toBe("RED");
    expect(state.players.find((p) => p.userId === "u3")).toBeUndefined();
  });

  it("scores one correct answer per player per round, wrong answers give nothing", async () => {
    const round = await toRound();
    await manager.handleComment(comment("blue", "BIRU"));
    await manager.handleComment(comment("red", "MERAH"));
    await manager.handleComment(comment("blue", String(round.blue.question.answer)));
    await manager.handleComment(comment("blue", String(round.blue.question.answer)));
    await manager.handleComment(comment("red", "99999"));
    const after = adapter().getHostState().round!;
    expect(after.blue.correctCount).toBe(1);
    expect(after.blue.answerPower).toBeGreaterThanOrEqual(1);
    expect(after.red.correctCount).toBe(0);
  });

  it("never shows the answers on the public overlay while the question is open", async () => {
    await toRound();
    const pub = manager.getPublicState().mathBattle!;
    expect(pub.round?.blue.question.answer).toBe(-1);
    expect(manager.getHostState().mathBattle!.round!.blue.question.answer).toBeGreaterThan(-1);
  });

  it("adds gift power by TikTok id or name and ignores duplicate events", async () => {
    await toRound();
    await manager.handleGift({ platformUserId: "d1", username: "sultan", giftId: "5655", giftName: "Rose", count: 2 });
    const dup = { platformUserId: "d1", username: "sultan", giftId: "5655", eventId: "evt-1", count: 2 };
    await manager.handleGift(dup);
    await manager.handleGift(dup);
    await manager.handleGift({ platformUserId: "d2", username: "ratu", giftId: "0", giftName: "rosa", count: 1 });
    const round = adapter().getHostState().round!;
    expect(round.blue.giftPower).toBe(20);
    expect(round.red.giftPower).toBe(15);
  });

  it("banks gift power sent between rounds for the next round", async () => {
    await manager.handleGift({ platformUserId: "d1", username: "sultan", giftId: "5655", count: 1 });
    expect(adapter().getHostState().bankedGiftPower.blue).toBe(5);
    const round = await toRound();
    expect(round.blue.giftPower).toBe(5);
  });

  it("moves the rope toward the stronger team and tracks the streak", async () => {
    await toRound();
    await manager.handleGift({ platformUserId: "s", username: "s", giftId: "5660", count: 3 });
    await adapter().skipAhead(); // end the round now
    const state = adapter().getHostState();
    expect(state.ropePosition).toBeLessThan(0);
    expect(state.round?.roundWinner).toBe("BLUE");
    expect(state.streak).toMatchObject({ team: "BLUE", count: 1 });
  });

  it("pausing and resuming mid-round never scores the round twice", async () => {
    await toRound();
    await manager.handleGift({ platformUserId: "s", username: "s", giftId: "5660", count: 1 });
    await adapter().skipAhead();
    const before = adapter().getHostState();
    await manager.pauseSession();
    expect(adapter().getHostState().status).toBe("PAUSED");
    await manager.resumeSession();
    const after = adapter().getHostState();
    expect(after.status).toBe(before.status);
    expect(after.blueTeamScore.totalPower).toBe(before.blueTeamScore.totalPower);
    expect(after.ropePosition).toBe(before.ropePosition);
  });

  it("ends a match on host request and can start a fresh one", async () => {
    await toRound();
    await adapter().endMatch("HOST", "RED");
    expect(adapter().getHostState().summary?.winner).toBe("RED");
    adapter().startMatch();
    const state = adapter().getHostState();
    expect(state.matchNumber).toBe(2);
    expect(state.ropePosition).toBe(0);
    expect(state.summary).toBeNull();
  });

  it("switches game while live", async () => {
    await manager.switchGame("TEBAK_KATA");
    expect(manager.getActiveGame()).toBe("TEBAK_KATA");
    expect(manager.getHostState().puzzle).not.toBeNull();
    await manager.endSession();
  });
});

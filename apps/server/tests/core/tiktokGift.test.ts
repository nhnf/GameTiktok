import { describe, expect, it } from "vitest";
import { BattleSimulation, GiftComboTracker, type IncomingGift } from "@tebak-kata/shared";
import { giftMessageToIncoming } from "../../src/core/live/tiktokMessages.js";

type RawGift = Parameters<typeof giftMessageToIncoming>[0];

let msgSeq = 1000;
function raw(opts: { userId?: string; giftId?: number; name?: string; type?: number; repeat: number; end?: boolean; group?: string; msgId?: string }): RawGift {
  return {
    user: { id: opts.userId ?? "7001", displayId: "ahmad", nickname: "Ahmad" } as RawGift["user"],
    giftId: String(opts.giftId ?? 5655),
    gift: { id: String(opts.giftId ?? 5655), name: opts.name ?? "Rose", type: opts.type ?? 1, combo: false, diamondCount: 1 } as unknown as RawGift["gift"],
    repeatCount: opts.repeat,
    repeatEnd: opts.end ? 1 : 0,
    groupId: opts.group ?? "g-1",
    common: { msgId: opts.msgId ?? String(++msgSeq) } as RawGift["common"],
  };
}

describe("TikTok gift message → IncomingGift", () => {
  it("a Rose combo ×10 arriving as cumulative ticks adds up to exactly 10", () => {
    const combos = new GiftComboTracker();
    const msgs = [raw({ repeat: 1 }), raw({ repeat: 4 }), raw({ repeat: 4 }), raw({ repeat: 9 }), raw({ repeat: 10, end: true })];
    const gifts = msgs.map((m) => giftMessageToIncoming(m, combos, 0)!.gift);
    expect(gifts.map((g) => g.count)).toEqual([1, 3, 0, 5, 1]);
    expect(gifts.map((g) => g.comboEnded)).toEqual([false, false, false, false, true]);
    expect(gifts[0]).toMatchObject({ platformUserId: "7001", username: "ahmad", giftId: "5655", giftName: "Rose", eventId: "tt:1001" });
  });

  it("non-streakable gifts (e.g. Galaxy) count once per message and are combo-ended", () => {
    const combos = new GiftComboTracker();
    const g = giftMessageToIncoming(raw({ giftId: 11046, name: "Galaxy", type: 2, repeat: 1, end: false }), combos, 0)!.gift;
    expect(g).toMatchObject({ count: 1, comboEnded: true, giftName: "Galaxy" });
  });

  it("returns null without a user or gift id", () => {
    const combos = new GiftComboTracker();
    expect(giftMessageToIncoming({ ...raw({ repeat: 1 }), user: undefined }, combos, 0)).toBeNull();
    expect(giftMessageToIncoming({ ...raw({ repeat: 1 }), giftId: "0", gift: undefined }, combos, 0)).toBeNull();
  });

  it("end-to-end: combo + re-delivered message → correct number of units in the battle", () => {
    const combos = new GiftComboTracker();
    const sim = new BattleSimulation({
      config: { autoNextMatch: false, countdownSeconds: 0 },
      mappings: [{ id: "1", giftId: "5655", giftName: "Rose", team: "A", unitType: "SPEARMAN", quantity: 1, enabled: true }],
    });
    sim.startMatch();
    sim.step(50);
    const feed = (g: IncomingGift) =>
      g.count! > 0 &&
      sim.receiveGift({ eventId: g.eventId!, viewerId: g.platformUserId, viewerName: g.username, giftId: g.giftId, giftName: g.giftName, count: g.count!, receivedAt: 0 });

    const tick = raw({ repeat: 3, msgId: "same" });
    feed(giftMessageToIncoming(raw({ repeat: 1 }), combos, 0)!.gift);
    feed(giftMessageToIncoming(tick, combos, 0)!.gift);
    // TikTok re-delivers the exact same message: the combo tracker adds 0,
    // and even if it were forwarded, the engine drops the repeated msgId.
    const replay = giftMessageToIncoming(tick, combos, 0)!.gift;
    expect(replay.count).toBe(0);
    expect(sim.receiveGift({ eventId: replay.eventId!, viewerId: "7001", viewerName: "ahmad", giftId: "5655", count: 2, receivedAt: 0 })).toEqual({ ok: false, reason: "DUPLICATE" });
    feed(giftMessageToIncoming(raw({ repeat: 5, end: true }), combos, 0)!.gift);
    for (let i = 0; i < 20; i++) sim.step(50);
    expect(sim.snapshot().teams.A.unitsSpawned).toBe(5);
  });

  it("parses high-diamond gifts (e.g. 100 coins) with correct diamondCount", () => {
    const combos = new GiftComboTracker();
    const g = giftMessageToIncoming(
      {
        user: { id: "8888", displayId: "topdonator", nickname: "Sultan" } as RawGift["user"],
        giftId: "9999",
        gift: { id: "9999", name: "Corgi", type: 2, combo: false, diamondCount: 100 } as unknown as RawGift["gift"],
        repeatCount: 1,
        repeatEnd: 0,
        groupId: "g-99",
        common: { msgId: "99999" } as RawGift["common"],
      },
      combos,
      0,
    )!.gift;

    expect(g.diamondCount).toBe(100);
    expect(g.count).toBe(1);

    // Calculation verification: 100 diamonds * 1 gift * 60 seconds = 6000 seconds
    const coins = (g.diamondCount || 1) * (g.count || 1);
    const addedSec = coins * 60;
    expect(coins).toBe(100);
    expect(addedSec).toBe(6000);
  });
});

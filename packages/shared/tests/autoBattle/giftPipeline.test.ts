import { describe, expect, it } from "vitest";
import { DEFAULT_BATTLE_GIFT_MAPPINGS, EventIdDeduper, GiftComboTracker, findGiftMapping, validateGiftMappings } from "../../src/index.js";
import { MAPPINGS, gift, makeSim, run, startBattle } from "./fixtures.js";

describe("gift mapping", () => {
  it("matches by TikTok gift id first, then by name (case/space-insensitive)", () => {
    expect(findGiftMapping(MAPPINGS, "5655", "whatever")?.id).toBe("1");
    expect(findGiftMapping(MAPPINGS, "7777", "  corgi ")?.id).toBe("3");
    expect(findGiftMapping(MAPPINGS, "8888", "rose")?.id).toBe("1"); // regional id variant
    expect(findGiftMapping(MAPPINGS, "8888", "Unknown")).toBeNull();
  });

  it("validates duplicates, team, unit and quantity (PRD §34)", () => {
    const errors = validateGiftMappings([
      { giftId: "1", giftName: "Rose", team: "A", unitType: "TANK", quantity: 1, enabled: true },
      { giftId: "1", giftName: "ROSE", team: "A", unitType: "TANK", quantity: 1, enabled: true },
      // @ts-expect-error invalid on purpose
      { giftId: null, giftName: "X", team: "C", unitType: "DRAGON", quantity: 0, enabled: true },
    ]);
    expect(errors.map((e) => `${e.index}:${e.field}`)).toEqual(["1:giftId", "1:giftName", "2:team", "2:unitType", "2:quantity"]);
  });

  it("ships a valid default table: 8 units × 2 teams, no duplicates", () => {
    expect(validateGiftMappings(DEFAULT_BATTLE_GIFT_MAPPINGS)).toEqual([]);
    expect(DEFAULT_BATTLE_GIFT_MAPPINGS.filter((m) => m.team === "A")).toHaveLength(8);
    expect(new Set(DEFAULT_BATTLE_GIFT_MAPPINGS.filter((m) => m.team === "B").map((m) => m.unitType)).size).toBe(8);
  });
});

describe("event de-duplication & combos", () => {
  it("EventIdDeduper rejects repeats and stays bounded", () => {
    const d = new EventIdDeduper(3);
    expect(d.markIfNew("a")).toBe(true);
    expect(d.markIfNew("a")).toBe(false);
    d.markIfNew("b");
    d.markIfNew("c");
    d.markIfNew("d");
    expect(d.size).toBe(3);
    expect(d.markIfNew("a")).toBe(true); // evicted long ago
  });

  it("GiftComboTracker turns cumulative TikTok combo counts into deltas totalling the combo", () => {
    const c = new GiftComboTracker();
    const tick = (repeatCount: number, repeatEnd = false) =>
      c.delta({ userId: "u", giftId: "5655", groupId: "g1", repeatCount, repeatEnd, streakable: true, now: 0 });
    expect([tick(1), tick(3), tick(3), tick(2), tick(7), tick(10, true)]).toEqual([1, 2, 0, 0, 4, 3]);
    expect(tick(10, true)).toBe(0); // re-sent final message
    expect(tick(1)).toBe(1); // next streak on the same key starts fresh
  });

  it("non-streakable gifts count their repeatCount directly", () => {
    const c = new GiftComboTracker();
    expect(c.delta({ userId: "u", giftId: "11046", repeatCount: 1, repeatEnd: true, streakable: false, now: 0 })).toBe(1);
    expect(c.delta({ userId: "u", giftId: "11046", repeatCount: 1, repeatEnd: true, streakable: false, now: 0 })).toBe(1);
  });
});

describe("BattleSimulation gift pipeline (PRD §41 Gift)", () => {
  it("gift determines team and unit, and spawns during battle", () => {
    const sim = makeSim();
    startBattle(sim);
    const r = sim.receiveGift(gift({ giftId: "5269" }));
    expect(r).toMatchObject({ ok: true, team: "B", unitType: "ARCHER", quantity: 2, queued: 0 });
    run(sim, 300);
    const units = sim.snapshot().units;
    expect(units.filter((u) => u[1] === "B" && u[2] === "ARCHER")).toHaveLength(2);
  });

  it("one viewer can reinforce both teams in the same match", () => {
    const sim = makeSim();
    startBattle(sim);
    sim.receiveGift(gift({ giftId: "5655" }));
    sim.receiveGift(gift({ giftId: "5269" }));
    run(sim, 300);
    const [me] = sim.allContributions();
    expect(me).toMatchObject({ viewerId: "u-ahmad", totalGifts: 2, unitsSpawned: 3, teamAUnits: 1, teamBUnits: 2 });
  });

  it("a duplicate event_id never produces a second spawn", () => {
    const sim = makeSim();
    startBattle(sim);
    const g = gift({ giftId: "5655" });
    expect(sim.receiveGift(g).ok).toBe(true);
    expect(sim.receiveGift({ ...g })).toEqual({ ok: false, reason: "DUPLICATE" });
    run(sim, 300);
    expect(sim.snapshot().units).toHaveLength(1);
  });

  it("rejects unmapped / disabled / invalid gifts without burning their event id", () => {
    const sim = makeSim();
    expect(sim.receiveGift(gift({ giftId: "123", eventId: "x1" }))).toEqual({ ok: false, reason: "UNMAPPED" });
    expect(sim.receiveGift(gift({ giftId: "999" }))).toEqual({ ok: false, reason: "DISABLED" });
    expect(sim.receiveGift(gift({ giftId: "5655", count: 0 }))).toEqual({ ok: false, reason: "INVALID" });
    // Host maps gift 123 afterwards: the same event id is still accepted.
    sim.setMappings([...MAPPINGS, { id: "9", giftId: "123", giftName: "New", team: "A", unitType: "TANK", quantity: 1, enabled: true }]);
    expect(sim.receiveGift(gift({ giftId: "123", eventId: "x1" })).ok).toBe(true);
  });

  it("combo count multiplies the mapping quantity", () => {
    const sim = makeSim();
    startBattle(sim);
    const r = sim.receiveGift(gift({ giftId: "5269", count: 5 }));
    expect(r).toMatchObject({ ok: true, quantity: 10 });
  });

  it("queues FIFO when a team is at capacity and spawns as units die", () => {
    const sim = makeSim({ maxUnitsPerTeam: 3 });
    startBattle(sim);
    const r = sim.receiveGift(gift({ giftId: "5655", count: 5 }));
    expect(r).toMatchObject({ ok: true, quantity: 5, queued: 2 });
    run(sim, 1000);
    let snap = sim.snapshot();
    expect(snap.teams.A.activeUnits).toBe(3);
    expect(snap.teams.A.queued).toBe(2);
    // Galaxy (Siege) arrives later: it must wait behind the 2 queued tanks.
    sim.receiveGift(gift({ giftId: "11046", viewerId: "u-budi", viewerName: "Budi" }));
    expect(sim.snapshot().teams.A.queued).toBe(3);

    // Red archers kill the tanks over time; queued units fill freed slots in order.
    for (let i = 0; i < 20; i++) sim.receiveGift(gift({ giftId: "5269", viewerId: `r${i}`, viewerName: `R${i}` }));
    const spawnedOrder: string[] = [];
    const seen = new Set<number>();
    for (let t = 0; t < 120_000 && sim.getStatus() === "BATTLE"; t += 50) {
      sim.step(50);
      snap = sim.snapshot();
      for (const u of snap.units) {
        if (u[1] === "A" && !seen.has(u[0])) {
          seen.add(u[0]);
          spawnedOrder.push(u[2]);
        }
      }
      if (seen.size >= 6) break;
    }
    expect(spawnedOrder).toEqual(["TANK", "TANK", "TANK", "TANK", "TANK", "SIEGE"]);
  });

  it("staggers multi-unit spawns (100ms apart) instead of stacking them", () => {
    const sim = makeSim();
    startBattle(sim);
    sim.receiveGift(gift({ giftId: "5655", count: 4 }));
    const counts: number[] = [];
    for (let i = 0; i < 8; i++) {
      sim.step(50);
      counts.push(sim.snapshot().teams.A.activeUnits);
    }
    expect(counts).toEqual([1, 1, 2, 2, 3, 3, 4, 4]);
  });

  it("gifts during lobby/pause are kept and spawn once the battle runs", () => {
    const sim = makeSim();
    sim.receiveGift(gift({ giftId: "5655", count: 2 }));
    expect(sim.snapshot().teams.A.queued).toBe(2);
    startBattle(sim);
    sim.pause();
    sim.receiveGift(gift({ giftId: "5655" }));
    run(sim, 500);
    expect(sim.snapshot().units).toHaveLength(0);
    sim.resume();
    run(sim, 500);
    expect(sim.snapshot().teams.A.activeUnits).toBe(3);
  });
});

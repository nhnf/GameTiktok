import { describe, expect, it } from "vitest";
import { BattleSimulation } from "../../src/index.js";
import { MAPPINGS, gift, makeSim, run, seeded, startBattle } from "./fixtures.js";

describe("BattleSimulation combat & match (PRD §41 Battle/Match)", () => {
  it("units move toward the enemy, fight, and die", () => {
    const sim = makeSim();
    startBattle(sim);
    sim.receiveGift(gift({ giftId: "5655" })); // blue tank
    run(sim, 100);
    const y0 = sim.snapshot().units[0][4];
    run(sim, 2000);
    expect(sim.snapshot().units[0][4]).toBeGreaterThan(y0); // Team A walks down
    for (let i = 0; i < 4; i++) sim.receiveGift(gift({ giftId: "5269" }));
    run(sim, 60_000);
    const snap = sim.snapshot();
    expect(snap.teams.A.damageDealt + snap.teams.B.damageDealt).toBeGreaterThan(0);
    expect(snap.units.some((u) => u[1] === "A")).toBe(false); // outnumbered tank fell
  });

  it("towers shoot units in range", () => {
    const sim = makeSim();
    startBattle(sim);
    sim.receiveGift(gift({ giftId: "5655", count: 3 }));
    const blueTowerHp = () => sim.snapshot().structures.filter((s) => s.team === "B" && s.kind === "TOWER");
    let towerFired = false;
    for (let t = 0; t < 60_000 && !towerFired; t += 50) {
      sim.step(50);
      towerFired = sim.snapshot().fx.some((f) => f.k === "shot" && f.style === "tower");
    }
    expect(towerFired).toBe(true);
    expect(blueTowerHp()).toHaveLength(2);
  });

  it("siege/heavy target defense first; base destruction ends the match with Team A winning", () => {
    const sim = makeSim({ baseHp: 1500, towerHp: 600 });
    startBattle(sim);
    sim.receiveGift(gift({ giftId: "11046", count: 6 })); // blue siege ×6
    sim.receiveGift(gift({ giftId: "5655", count: 6, viewerId: "u-tank", viewerName: "Tank" }));
    for (let t = 0; t < 240_000 && sim.getStatus() !== "ENDED"; t += 50) sim.step(50);
    const result = sim.getResult();
    expect(result).toMatchObject({ winner: "A", reason: "BASE_DESTROYED" });
    expect(result!.baseHp.B).toBe(0);
    expect(result!.mvp.mostBuildingDamage?.buildingDamage).toBeGreaterThan(0);
    expect(sim.snapshot().feed.some((f) => f.kind === "TOWER_DOWN")).toBe(true);
  });

  it("timer end: higher base HP wins", () => {
    const sim = makeSim({ matchDuration: 40, baseHp: 50_000, towerHp: 400 });
    startBattle(sim);
    sim.receiveGift(gift({ giftId: "11046", count: 4 }));
    run(sim, 41_000);
    expect(sim.getStatus()).toBe("ENDED");
    expect(sim.getResult()).toMatchObject({ winner: "A", reason: "TIMER_HP" });
  });

  it("equal HP at the timer → Sudden Death (base damage ×2), gifts still accepted", () => {
    const sim = makeSim({ matchDuration: 1 });
    startBattle(sim);
    run(sim, 1100);
    expect(sim.getStatus()).toBe("SUDDEN_DEATH");
    expect(sim.snapshot().timeLeft).toBeNull();
    expect(sim.receiveGift(gift({ giftId: "5655" })).ok).toBe(true);
  });

  it("host end match picks the leader; reset starts a fresh match and clears the queue", () => {
    const sim = makeSim();
    startBattle(sim);
    sim.receiveGift(gift({ giftId: "5655", count: 100 }));
    run(sim, 200);
    const result = sim.endMatch();
    expect(result?.reason).toBe("HOST");
    expect(sim.getStatus()).toBe("ENDED");
    const before = sim.getMatchId();
    sim.reset();
    expect(sim.getStatus()).toBe("WAITING");
    expect(sim.getMatchId()).not.toBe(before);
    expect(sim.snapshot().teams.A.queued).toBe(0);
    expect(sim.snapshot().units).toHaveLength(0);
  });

  it("auto flow: lobby → countdown → battle → result → lobby", () => {
    const sim = new BattleSimulation({
      config: { autoNextMatch: true, lobbySeconds: 1, countdownSeconds: 1, resultSeconds: 1, matchDuration: 2, suddenDeath: false },
      mappings: MAPPINGS,
      random: seeded(),
    });
    const seen: string[] = [];
    for (let t = 0; t < 8000; t += 50) {
      sim.step(50);
      const s = sim.getStatus();
      if (seen[seen.length - 1] !== s) seen.push(s);
    }
    expect(seen.slice(0, 5)).toEqual(["WAITING", "COUNTDOWN", "BATTLE", "ENDED", "WAITING"]);
    expect(sim.getMatchNumber()).toBeGreaterThanOrEqual(2);
  });

  it("feed aggregates rapid repeats of the same gift (PRD §17)", () => {
    const sim = makeSim();
    startBattle(sim);
    for (let i = 0; i < 5; i++) sim.receiveGift(gift({ giftId: "5655" }));
    const spawnFeed = sim.snapshot().feed.filter((f) => f.kind === "SPAWN");
    expect(spawnFeed).toHaveLength(1);
    expect(spawnFeed[0].text).toBe("@Ahmad ×5 TEAM BIRU GUARDIAN");
  });

  it("no unit ever walks past a living enemy — building hunters must fight through (frontline)", () => {
    const sim = makeSim();
    startBattle(sim);
    sim.receiveGift(gift({ giftId: "11046", count: 3, viewerId: "u-siege", viewerName: "Siege" })); // blue siege → targets towers
    sim.receiveGift(gift({ giftId: "5655", count: 2, viewerId: "u-tank", viewerName: "Tank" })); // blue tanks
    sim.receiveGift(gift({ giftId: "5269", count: 2, viewerId: "u-red", viewerName: "Red" })); // 4 red archers
    let checked = 0;
    let redSeen = false;
    for (let t = 0; t < 90_000 && sim.getStatus() === "BATTLE"; t += 50) {
      sim.step(50);
      const units = sim.snapshot().units.filter((u) => u[6] !== "SPAWNING" && u[6] !== "DEATH");
      const red = units.filter((u) => u[1] === "B");
      if (red.length === 0) {
        if (redSeen) break;
        continue;
      }
      redSeen = true;
      const redFront = Math.min(...red.map((u) => u[4]));
      for (const blue of units.filter((u) => u[1] === "A")) {
        expect(blue[4]).toBeLessThanOrEqual(redFront + 12);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(100);
    const siege = sim.allContributions().find((c) => c.viewerId === "u-siege")!;
    expect(siege.damage - siege.buildingDamage).toBeGreaterThan(0); // it had to hit the archers
  });

  it("emits per-unit attack events for animation sync", () => {
    const sim = makeSim();
    startBattle(sim);
    sim.receiveGift(gift({ giftId: "5655" }));
    sim.receiveGift(gift({ giftId: "5269", viewerId: "r", viewerName: "R" }));
    let atk = 0;
    for (let t = 0; t < 30_000; t += 50) {
      sim.step(50);
      atk += sim.snapshot().fx.filter((f) => f.k === "atk").length;
    }
    expect(atk).toBeGreaterThan(5);
  });

  it("stays within capacity under a gift flood (PRD §37)", () => {
    const sim = makeSim();
    startBattle(sim);
    for (let i = 0; i < 100; i++) {
      sim.receiveGift(gift({ giftId: i % 2 ? "5655" : "5269", viewerId: `v${i}`, viewerName: `V${i}`, count: 3 }));
    }
    for (let t = 0; t < 20_000; t += 50) {
      sim.step(50);
      const s = sim.snapshot();
      expect(s.teams.A.activeUnits).toBeLessThanOrEqual(40);
      expect(s.teams.B.activeUnits).toBeLessThanOrEqual(40);
    }
  });
});

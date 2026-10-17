import type { BattleConfig, ContributionEntry, MatchResult, MatchStatus } from "@tebak-kata/shared";
import { prisma } from "../../core/db.js";

/** Match history rows (PRD §30/§36). Every write is best-effort and never blocks the battle. */
export class BattleMatchStore {
  private readonly rows = new Map<string, Promise<unknown>>();

  /** Creates the match row once; later writes chain on it. */
  ensureMatch(matchId: string, info: { sessionId: string | null; matchNumber: number; status: MatchStatus; teams: BattleConfig["teams"] }): Promise<unknown> {
    let row = this.rows.get(matchId);
    if (!row) {
      row = prisma.battleMatch
        .upsert({
          where: { id: matchId },
          create: {
            id: matchId,
            sessionId: info.sessionId,
            matchNumber: info.matchNumber,
            status: info.status,
            teamAName: info.teams.A.name,
            teamBName: info.teams.B.name,
          },
          update: {},
        })
        .catch((err: unknown) => {
          this.rows.delete(matchId);
          throw err;
        });
      this.rows.set(matchId, row);
    }
    return row;
  }

  forget(matchId: string): void {
    this.rows.delete(matchId);
  }

  markBattleStarted(matchId: string): void {
    this.rows.get(matchId)?.then(() => prisma.battleMatch.update({ where: { id: matchId }, data: { status: "BATTLE", startedAt: new Date() } })).catch(() => {});
  }

  recordGift(matchId: string, data: { eventId: string; viewerId: string; viewerName: string; giftId: string; giftName: string; team: string; unitType: string; quantity: number; giftCount: number }): void {
    this.rows
      .get(matchId)
      ?.then(() => prisma.battleGiftEvent.create({ data: { matchId, ...data } }))
      .catch((err: unknown) => console.error("[autoBattle] failed to persist gift event:", err));
  }

  async saveResult(result: MatchResult, contributions: ContributionEntry[]): Promise<void> {
    try {
      await prisma.battleMatch.update({
        where: { id: result.matchId },
        data: {
          status: "ENDED",
          winner: result.winner,
          reason: result.reason,
          teamABaseHp: result.baseHp.A,
          teamBBaseHp: result.baseHp.B,
          duration: result.durationSeconds,
          totalGifts: result.totalGifts,
          teamAGifts: result.teams.A.gifts,
          teamBGifts: result.teams.B.gifts,
          unitsSpawned: result.teams.A.unitsSpawned + result.teams.B.unitsSpawned,
          resultJson: JSON.stringify(result),
          endedAt: new Date(),
        },
      });
      if (contributions.length > 0) {
        await prisma.battleContribution.createMany({
          data: contributions.map((c) => ({
            matchId: result.matchId,
            viewerId: c.viewerId,
            viewerName: c.viewerName,
            totalGifts: c.totalGifts,
            unitsSpawned: c.unitsSpawned,
            damage: c.damage,
            buildingDamage: c.buildingDamage,
            healing: c.healing,
            score: c.score,
          })),
        });
      }
    } catch (err) {
      console.error("[autoBattle] failed to persist match result:", err);
    }
  }
}

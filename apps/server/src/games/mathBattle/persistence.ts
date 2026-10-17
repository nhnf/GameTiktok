import {
  DEFAULT_MATH_BATTLE_CONFIG,
  DEFAULT_MATH_BATTLE_GIFT_MAPPINGS,
  LEGACY_MATH_BATTLE_GIFT_NAMES,
  type MathBattleConfig,
  type MathBattleGiftFeedItem,
  type MathBattleGiftMapping,
  type MathBattleGiftTier,
  type MathBattleMatchSummary,
  type MathBattleRoundState,
  type MathBattleTeamId,
} from "@tebak-kata/shared";
import { prisma } from "../../core/db.js";

function logError(err: unknown): void {
  console.error("[mathBattle] persistence failed:", err);
}

type MappingRow = Awaited<ReturnType<typeof prisma.mathBattleGiftMapping.findMany>>[number];

function toMapping(r: MappingRow): MathBattleGiftMapping {
  return {
    id: r.id,
    giftId: r.giftId,
    giftName: r.giftName,
    team: r.team as MathBattleTeamId | "NEUTRAL",
    tier: r.tier as MathBattleGiftTier,
    power: r.power,
    enabled: r.enabled,
    imageUrl: r.imageUrl,
    diamondCount: r.diamondCount,
  };
}

function seedData(m: MathBattleGiftMapping) {
  return {
    giftId: m.giftId,
    giftName: m.giftName,
    team: m.team,
    tier: m.tier,
    power: m.power,
    enabled: m.enabled,
    diamondCount: m.diamondCount ?? null,
  };
}

/** DB access for Tarik Tambang. */
export const mathBattleStore = {
  async loadConfig(): Promise<MathBattleConfig> {
    const row = await prisma.mathBattleSetting.findUnique({ where: { id: "default" } }).catch(() => null);
    if (!row) return { ...DEFAULT_MATH_BATTLE_CONFIG };
    try {
      return { ...DEFAULT_MATH_BATTLE_CONFIG, ...(JSON.parse(row.configJson) as Partial<MathBattleConfig>) };
    } catch {
      return { ...DEFAULT_MATH_BATTLE_CONFIG };
    }
  },

  async saveConfig(config: MathBattleConfig): Promise<void> {
    const configJson = JSON.stringify(config);
    await prisma.mathBattleSetting.upsert({ where: { id: "default" }, create: { id: "default", configJson }, update: { configJson } });
  },

  /** Loads mappings, seeding real TikTok gifts on first run and upgrading the old placeholder defaults. */
  async loadMappings(): Promise<MathBattleGiftMapping[]> {
    const rows = await prisma.mathBattleGiftMapping.findMany({ orderBy: { createdAt: "asc" } });
    if (rows.length === 0) {
      for (const m of DEFAULT_MATH_BATTLE_GIFT_MAPPINGS) {
        await prisma.mathBattleGiftMapping.create({ data: { id: m.id, ...seedData(m) } });
      }
      return this.loadMappings();
    }
    let upgraded = false;
    for (const row of rows) {
      const legacyName = LEGACY_MATH_BATTLE_GIFT_NAMES[row.id];
      const replacement = DEFAULT_MATH_BATTLE_GIFT_MAPPINGS.find((m) => m.id === row.id);
      if (legacyName && replacement && row.giftId === null && row.giftName === legacyName) {
        const idTaken = rows.some((o) => o.id !== row.id && o.giftId === replacement.giftId);
        if (idTaken) continue;
        await prisma.mathBattleGiftMapping.update({ where: { id: row.id }, data: { ...seedData(replacement), enabled: row.enabled } });
        upgraded = true;
      }
    }
    return upgraded ? this.loadMappings() : rows.map(toMapping);
  },

  async resetMappings(): Promise<void> {
    await prisma.$transaction([
      prisma.mathBattleGiftMapping.deleteMany({}),
      ...DEFAULT_MATH_BATTLE_GIFT_MAPPINGS.map((m) => prisma.mathBattleGiftMapping.create({ data: { id: m.id, ...seedData(m) } })),
    ]);
  },

  createMatch(matchId: string, sessionId: string | null, matchNumber: number, totalRounds: number): Promise<unknown> {
    return prisma.mathBattleMatch
      .create({
        data: { id: matchId, sessionId, matchNumber, status: "ACTIVE", totalRounds, completedRounds: 0, finalRopePosition: 0 },
      })
      .catch(logError);
  },

  recordRound(matchId: string, round: MathBattleRoundState): void {
    prisma.mathBattleRoundRecord
      .create({
        data: {
          matchId,
          roundNumber: round.roundNumber,
          blueQuestion: round.blue.question.expression,
          blueAnswer: round.blue.question.answer,
          redQuestion: round.red.question.expression,
          redAnswer: round.red.question.answer,
          blueAnswerPower: round.blue.answerPower,
          redAnswerPower: round.red.answerPower,
          blueGiftPower: round.blue.giftPower,
          redGiftPower: round.red.giftPower,
          blueTotalPower: round.blue.totalPower,
          redTotalPower: round.red.totalPower,
          ropePositionBefore: round.ropePositionBefore,
          ropePositionAfter: round.ropePositionAfter,
          roundWinner: round.roundWinner ?? "DRAW",
        },
      })
      .catch(logError);
  },

  recordGift(matchId: string, roundNumber: number, eventId: string, item: MathBattleGiftFeedItem): void {
    prisma.mathBattleGiftEventRecord
      .create({
        data: {
          matchId,
          roundNumber,
          eventId,
          viewerId: item.viewerId,
          viewerName: item.username,
          giftId: item.giftId,
          giftName: item.giftName,
          team: item.team,
          tier: item.tier,
          power: item.power,
          giftCount: item.count,
        },
      })
      .catch(logError);
  },

  finishMatch(summary: MathBattleMatchSummary): Promise<unknown> {
    return prisma.mathBattleMatch
      .update({
        where: { id: summary.matchId },
        data: {
          status: "ENDED",
          winner: summary.winner,
          winningReason: summary.winningReason,
          totalRounds: summary.totalRounds,
          completedRounds: summary.completedRounds,
          finalRopePosition: summary.finalRopePosition,
          blueTotalPower: summary.blueScore.totalPower,
          redTotalPower: summary.redScore.totalPower,
          blueAnswerPower: summary.blueScore.answerPower,
          redAnswerPower: summary.redScore.answerPower,
          blueGiftPower: summary.blueScore.giftPower,
          redGiftPower: summary.redScore.giftPower,
          blueRoundsWon: summary.blueScore.roundsWon,
          redRoundsWon: summary.redScore.roundsWon,
          resultJson: JSON.stringify(summary),
          endedAt: new Date(),
        },
      })
      .catch(logError);
  },

  history(page: number, limit: number) {
    return Promise.all([
      prisma.mathBattleMatch.findMany({
        where: { status: "ENDED" },
        orderBy: { startedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { rounds: { orderBy: { roundNumber: "asc" } } },
      }),
      prisma.mathBattleMatch.count({ where: { status: "ENDED" } }),
    ]);
  },
};

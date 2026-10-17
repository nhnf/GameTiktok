import { nanoid } from "nanoid";
import type { LeaderboardEntry, PlayerRef } from "@tebak-kata/shared";
import { prisma } from "../db.js";
import type { PlayerIdentity, SessionPlayer } from "./gameAdapter.js";

const LEADERBOARD_SIZE = 50;

/** Every viewer who took part in the current LIVE session (PRD 28: resets per session). */
export class PlayerRegistry {
  private readonly players = new Map<string, SessionPlayer>(); // key: platformUserId

  get size(): number {
    return this.players.size;
  }

  clear(): void {
    this.players.clear();
  }

  getOrCreate(identity: PlayerIdentity, sessionId: string | null): SessionPlayer {
    const existing = this.players.get(identity.platformUserId);
    if (existing) {
      // Keep the latest display data (TikTok users rename / change avatars).
      existing.username = identity.username || existing.username;
      existing.displayName = identity.displayName ?? existing.displayName;
      existing.avatarUrl = identity.avatarUrl ?? existing.avatarUrl;
      return existing;
    }

    const created: SessionPlayer = {
      localId: nanoid(),
      platformUserId: identity.platformUserId,
      username: identity.username,
      displayName: identity.displayName,
      avatarUrl: identity.avatarUrl,
      points: 0,
      wins: 0,
      guesses: 0,
      dbReady: sessionId ? this.persist(identity, sessionId) : Promise.resolve(nanoid()),
    };
    // Never leave an unhandled rejection behind if the DB write fails.
    created.dbReady.catch((err: unknown) => console.error("[players] failed to persist player:", err));
    this.players.set(identity.platformUserId, created);
    return created;
  }

  private persist(identity: PlayerIdentity, sessionId: string): Promise<string> {
    return prisma.sessionPlayer
      .upsert({
        where: { sessionId_platformUserId: { sessionId, platformUserId: identity.platformUserId } },
        create: {
          sessionId,
          platformUserId: identity.platformUserId,
          username: identity.username,
          displayName: identity.displayName,
          avatarUrl: identity.avatarUrl,
        },
        update: {},
      })
      .then((row) => row.id);
  }

  toPlayerRef(p: PlayerIdentity): PlayerRef {
    return { userId: p.platformUserId, username: p.username, displayName: p.displayName, avatarUrl: p.avatarUrl };
  }

  resetAllPoints(): void {
    for (const player of this.players.values()) {
      player.points = 0;
    }
  }

  deductOpponentPoints(gifterUserId: string, amount: number, opponentUserIds?: string[]): { affectedPlayers: SessionPlayer[]; totalDeducted: number } {
    if (amount <= 0) return { affectedPlayers: [], totalDeducted: 0 };
    const affected: SessionPlayer[] = [];
    let totalDeducted = 0;

    if (opponentUserIds && opponentUserIds.length > 0) {
      for (const uid of opponentUserIds) {
        if (uid === gifterUserId) continue;
        const p = this.players.get(uid);
        if (p && p.points > 0) {
          const deduct = Math.min(p.points, amount);
          p.points = Math.max(0, p.points - amount);
          totalDeducted += deduct;
          affected.push(p);
        }
      }
    } else {
      const opponents = [...this.players.values()]
        .filter((p) => p.platformUserId !== gifterUserId && p.points > 0)
        .sort((a, b) => b.points - a.points);

      if (opponents.length > 0) {
        const topOpponent = opponents[0];
        const deduct = Math.min(topOpponent.points, amount);
        topOpponent.points = Math.max(0, topOpponent.points - amount);
        totalDeducted += deduct;
        affected.push(topOpponent);
      }
    }

    return { affectedPlayers: affected, totalDeducted };
  }

  getPlayerRank(userId: string): number | null {
    const list = this.leaderboard();
    const idx = list.findIndex((p) => p.userId === userId);
    return idx >= 0 ? idx + 1 : null;
  }

  leaderboard(): LeaderboardEntry[] {
    return [...this.players.values()]
      .filter((p) => p.points > 0 || p.wins > 0)
      .map((p) => ({ ...this.toPlayerRef(p), points: p.points, wins: p.wins, streak: p.streak }))
      .sort((a, b) => b.points - a.points || b.wins - a.wins)
      .slice(0, LEADERBOARD_SIZE);
  }
}

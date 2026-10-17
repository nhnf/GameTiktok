"use client";

import { useState } from "react";
import type { MathBattleHostState, MathBattleTeamId } from "@tebak-kata/shared";
import { errorMessage } from "@/lib/errors";
import { Card, CardTitle } from "@/components/ui/Card";
import { ErrorNote } from "@/components/ui/ErrorNote";
import { mathBattleApi } from "../api";
import { TEAM_STYLE } from "../labels";

const SHOWN_PER_TEAM = 20;

/** Team rosters with a button to move a viewer to the other team. */
export function PlayersPanel({ token, battle }: { token: string; battle: MathBattleHostState | null }) {
  const [moving, setMoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const players = battle?.players ?? [];

  const move = async (userId: string, team: MathBattleTeamId) => {
    setMoving(userId);
    setError(null);
    try {
      await mathBattleApi.movePlayer(token, userId, team);
    } catch (err) {
      setError(errorMessage(err, "Gagal memindahkan pemain."));
    } finally {
      setMoving(null);
    }
  };

  return (
    <Card>
      <CardTitle>Pemain per tim</CardTitle>
      {error && <ErrorNote message={error} className="mb-2" />}
      {players.length === 0 && <p className="text-xs font-medium text-muted">Belum ada pemain. Penonton ketik BIRU atau MERAH untuk bergabung.</p>}
      <div className="grid max-h-56 grid-cols-2 gap-2 overflow-y-auto pr-1">
        {(["BLUE", "RED"] as const).map((team) => {
          const other: MathBattleTeamId = team === "BLUE" ? "RED" : "BLUE";
          const list = players.filter((p) => p.team === team).sort((a, b) => b.matchPower - a.matchPower);
          return (
            <div key={team} className="flex flex-col gap-1">
              <span className={`text-xs font-black ${TEAM_STYLE[team].text}`}>
                {TEAM_STYLE[team].emoji} {list.length} pemain
              </span>
              {list.slice(0, SHOWN_PER_TEAM).map((p) => (
                <div key={p.userId} className="flex items-center justify-between gap-1 rounded border border-ink/30 bg-white px-2 py-1 text-xs">
                  <span className="min-w-0 truncate font-bold">@{p.username}</span>
                  <span className="shrink-0 font-mono text-[10px] text-muted">{p.matchPower}</span>
                  <button
                    type="button"
                    onClick={() => void move(p.userId, other)}
                    disabled={moving === p.userId}
                    className={`shrink-0 rounded border border-ink px-1 text-[10px] font-bold ${TEAM_STYLE[other].soft} ${TEAM_STYLE[other].text}`}
                    title={`Pindahkan ke ${TEAM_STYLE[other].name}`}
                  >
                    {team === "BLUE" ? "➡" : "⬅"}
                  </button>
                </div>
              ))}
              {list.length > SHOWN_PER_TEAM && <span className="text-[10px] text-muted">+{list.length - SHOWN_PER_TEAM} lainnya</span>}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

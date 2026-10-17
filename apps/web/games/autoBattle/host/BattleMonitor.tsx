"use client";

import type { BattleHostState, BattleSnapshot, TeamId } from "@tebak-kata/shared";
import { Card, CardTitle } from "@/components/ui/Card";
import { STATUS_LABEL, clock } from "./labels";

/** PRD §35 — live monitor: match clock, base/tower HP and unit counts per team. */
export function BattleMonitor({ frame, battle }: { frame: BattleSnapshot | null; battle: BattleHostState | null }) {
  const status = frame?.status ?? battle?.status ?? "WAITING";
  const pill = STATUS_LABEL[status];
  const phaseNote =
    status === "WAITING"
      ? frame?.phaseTimeLeft != null
        ? `Mulai otomatis ${frame.phaseTimeLeft} dtk`
        : "Menunggu host"
      : status === "COUNTDOWN"
        ? `${frame?.phaseTimeLeft ?? ""}…`
        : status === "ENDED" && frame?.phaseTimeLeft != null
          ? `Lobby dalam ${frame.phaseTimeLeft} dtk`
          : null;

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between gap-2">
        <CardTitle className="mb-0">⚔️ Battle #{battle?.matchNumber ?? 1}</CardTitle>
        <span className={`rounded-full border-2 border-ink px-3 py-1 text-xs font-bold uppercase ${pill.tone}`}>{pill.text}</span>
      </div>
      <div className="mb-4 flex items-end justify-between rounded-nb-sm border-3 border-ink bg-ink px-4 py-2 text-white">
        <span className="font-mono text-4xl font-bold">{status === "SUDDEN_DEATH" ? "💀 SD" : clock(frame?.timeLeft ?? battle?.config.matchDuration)}</span>
        {phaseNote && <span className="text-xs font-bold uppercase text-yellow">{phaseNote}</span>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {(["A", "B"] as const).map((team) => (
          <TeamMonitor key={team} team={team} frame={frame} battle={battle} />
        ))}
      </div>
    </Card>
  );
}

function TeamMonitor({ team, frame, battle }: { team: TeamId; frame: BattleSnapshot | null; battle: BattleHostState | null }) {
  const info = frame?.teams[team] ?? battle?.config.teams[team];
  const structures = frame?.structures.filter((s) => s.team === team) ?? [];
  const base = structures.find((s) => s.kind === "BASE");
  const towers = structures.filter((s) => s.kind === "TOWER");
  const stats = frame?.teams[team];
  const bar = (hp: number, max: number) => (
    <div className="h-2.5 w-full overflow-hidden rounded-full border-2 border-ink bg-paper">
      <div className="h-full" style={{ width: `${Math.max(0, (hp / max) * 100)}%`, background: info?.color }} />
    </div>
  );

  return (
    <div className="rounded-nb-sm border-3 border-ink p-2.5" style={{ background: `${info?.color ?? "#999"}22` }}>
      <div className="mb-2 truncate text-sm font-black uppercase" style={{ color: info?.color }}>
        {info?.emblem} {info?.name}
      </div>
      <div className="mb-1 flex justify-between text-[11px] font-bold uppercase text-muted">
        <span>Base</span>
        <span className="font-mono text-ink">{base ? `${base.hp.toLocaleString("id-ID")}` : "-"}</span>
      </div>
      {base && bar(base.hp, base.maxHp)}
      <div className="mt-2 mb-1 text-[11px] font-bold uppercase text-muted">Tower</div>
      <div className="grid grid-cols-2 gap-1.5">
        {towers.map((t) => (
          <div key={t.id}>{t.hp > 0 ? bar(t.hp, t.maxHp) : <div className="text-center text-[10px] font-black text-red">HANCUR</div>}</div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1 text-center">
        {(
          [
            ["Aktif", stats?.activeUnits ?? 0],
            ["Antre", stats?.queued ?? 0],
            ["Gift", stats?.gifts ?? 0],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="rounded border-2 border-ink bg-white py-0.5">
            <div className="text-[9px] font-bold uppercase text-muted">{label}</div>
            <div className="font-mono text-sm font-bold">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

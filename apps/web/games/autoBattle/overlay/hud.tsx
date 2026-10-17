import type { BattlePublicState, BattleSnapshot, TeamId } from "@tebak-kata/shared";
import { FALLBACK_TEAM, formatClock } from "./battleFormat";

// ---------------------------------------------------------------------------
// Top HUD (PRD §22 Top HUD)
// ---------------------------------------------------------------------------

export function TopHud({ frame, state }: { frame: BattleSnapshot | null; state: BattlePublicState | null }) {
  const teams = frame?.teams ?? state?.config.teams ?? FALLBACK_TEAM;
  const base = (team: TeamId) => frame?.structures.find((s) => s.team === team && s.kind === "BASE");
  const pct = (team: TeamId) => {
    const b = base(team);
    return b ? Math.max(0, Math.round((b.hp / b.maxHp) * 100)) : 100;
  };
  const status = frame?.status ?? state?.status ?? "WAITING";
  const sudden = status === "SUDDEN_DEATH" || (status === "PAUSED" && frame?.pausedFrom === "SUDDEN_DEATH");
  const time = frame?.timeLeft ?? state?.config.matchDuration ?? 300;

  return (
    <div className="absolute inset-x-0 top-0 z-20 h-[168px] bg-gradient-to-b from-[#07101F] via-[#0B1730]/95 to-transparent px-6 pt-5">
      <div className="flex items-start justify-between gap-4">
        <TeamPanel team="A" name={teams.A.name} emblem={teams.A.emblem} color={teams.A.color} pct={pct("A")} />
        <div className="flex w-[180px] shrink-0 flex-col items-center gap-2 pt-1">
          <div className="bg-gradient-to-b from-[#FFE9A3] to-[#E3A21A] bg-clip-text font-display text-[64px] leading-none text-transparent drop-shadow-[0_4px_0_rgba(0,0,0,0.6)]">
            VS
          </div>
          <div
            className={`flex items-center gap-2 rounded-full border-2 px-4 py-1 font-mono text-[30px] font-bold leading-none ${
              sudden ? "border-[#FF5A4A] bg-[#4A0E0E] text-[#FFB3A8]" : time <= 30 ? "border-[#FF5A4A] bg-[#1A2440] text-[#FF8A7A]" : "border-white/30 bg-[#1A2440] text-white"
            }`}
          >
            {sudden ? "💀 SD" : status === "ENDED" ? "SELESAI" : `⏱ ${formatClock(time)}`}
          </div>
        </div>
        <TeamPanel team="B" name={teams.B.name} emblem={teams.B.emblem} color={teams.B.color} pct={pct("B")} />
      </div>
    </div>
  );
}

export function TeamPanel({ team, name, emblem, color, pct }: { team: TeamId; name: string; emblem: string; color: string; pct: number }) {
  const right = team === "B";
  const critical = pct < 25;
  return (
    <div className={`flex min-w-0 flex-1 items-center gap-3 ${right ? "flex-row-reverse" : ""}`}>
      <div
        className="flex h-[92px] w-[80px] shrink-0 items-center justify-center border-4 border-[#F5C542] text-[40px] shadow-lg"
        style={{ background: `linear-gradient(180deg, ${color}, #0B1426)`, clipPath: "polygon(0 0,100% 0,100% 70%,50% 100%,0 70%)" }}
      >
        {emblem}
      </div>
      <div className={`flex min-w-0 flex-1 flex-col gap-2 ${right ? "items-end" : ""}`}>
        <div className="max-w-full truncate font-display text-[34px] uppercase leading-none tracking-wide drop-shadow-[0_3px_0_rgba(0,0,0,0.7)]">
          {name}
        </div>
        <div className="relative h-[34px] w-full overflow-hidden rounded-full border-[3px] border-[#0A0F1C] bg-[#0A0F1C]/80">
          <div
            className={`absolute inset-y-0 ${right ? "right-0" : "left-0"} rounded-full transition-[width] duration-300 ${critical ? "animate-blink" : ""}`}
            style={{ width: `${pct}%`, background: `linear-gradient(180deg, ${color}, ${color}B0)` }}
          />
          <div className={`absolute inset-0 flex items-center px-4 font-mono text-[20px] font-bold ${right ? "justify-end" : ""}`}>{pct}%</div>
        </div>
      </div>
    </div>
  );
}

export function ArmyCounts({ frame }: { frame: BattleSnapshot }) {
  const chip = (team: TeamId) => {
    const t = frame.teams[team];
    return (
      <div className="flex items-center gap-2 rounded-full border-2 border-white/25 bg-[#0B1426]/80 px-3 py-1 text-[20px] font-bold" style={{ color: t.color }}>
        ⚔ <span className="text-white">{t.activeUnits}</span>
        {t.queued > 0 && <span className="text-[16px] text-white/70">+{t.queued} antre</span>}
      </div>
    );
  };
  return (
    <div className="absolute inset-x-6 top-[150px] z-20 flex justify-between">
      {chip("A")}
      {chip("B")}
    </div>
  );
}

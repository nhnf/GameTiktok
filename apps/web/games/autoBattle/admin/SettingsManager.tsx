"use client";

import { useEffect, useState } from "react";
import { UNIT_META, UNIT_TYPES, type BattleConfig, type TeamId, type UnitStats } from "@tebak-kata/shared";
import { battleApi } from "../api";
import { errorMessage } from "@/lib/errors";
import { useAdminToken } from "@/lib/hostTokenContext";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { AdminPageHeader } from "@/components/shell/AdminPageHeader";

type NumericConfigKey = {
  [K in keyof BattleConfig]: BattleConfig[K] extends number ? K : never;
}[keyof BattleConfig];

const BATTLE_FIELDS: Array<{ key: NumericConfigKey; label: string; hint: string; step?: number }> = [
  { key: "matchDuration", label: "Durasi match (detik)", hint: "PRD default 300" },
  { key: "baseHp", label: "HP base", hint: "" },
  { key: "towerHp", label: "HP tower", hint: "" },
  { key: "towerDamage", label: "Damage tower", hint: "" },
  { key: "towerAttackSpeed", label: "Jeda serang tower (dtk)", hint: "", step: 0.1 },
  { key: "towerRange", label: "Jangkauan tower", hint: "", step: 0.5 },
  { key: "baseDamage", label: "Damage base (0 = mati)", hint: "Pertahanan kastil" },
  { key: "baseRange", label: "Jangkauan base", hint: "", step: 0.5 },
  { key: "maxUnitsPerTeam", label: "Maks unit / tim", hint: "Sisanya antre (FIFO)" },
  { key: "damageMultiplier", label: "Pengali damage global", hint: "", step: 0.1 },
  { key: "countdownSeconds", label: "Countdown (dtk)", hint: "3 → 2 → 1" },
  { key: "resultSeconds", label: "Layar hasil (dtk)", hint: "" },
  { key: "lobbySeconds", label: "Lobby otomatis (dtk)", hint: "Jika auto-next aktif" },
  { key: "spawnStaggerMs", label: "Jeda antar spawn (ms)", hint: "PRD 100ms" },
];

const UNIT_FIELDS: Array<{ key: Exclude<keyof UnitStats, "targetPriority">; label: string; step: number }> = [
  { key: "hp", label: "HP", step: 50 },
  { key: "damage", label: "Damage", step: 10 },
  { key: "attackSpeed", label: "Jeda serang", step: 0.1 },
  { key: "range", label: "Range", step: 0.5 },
  { key: "moveSpeed", label: "Speed", step: 0.05 },
  { key: "abilityCooldown", label: "CD ability", step: 1 },
  { key: "abilityPower", label: "Power ability", step: 0.1 },
  { key: "buildingDamage", label: "× bangunan", step: 0.05 },
];

const PRIORITY_LABEL: Record<UnitStats["targetPriority"], string> = {
  NEAREST_ENEMY: "Musuh terdekat",
  DEFENSE_THEN_BASE: "Tower → Base",
  LARGEST_CLUSTER: "Kerumunan terbesar",
  BASE_THEN_DEFENSE_THEN_UNIT: "Base → Tower → Unit",
  LOWEST_HP_ALLY: "Kawan HP terendah",
};

/** PRD §32 Team/Battle Settings + §33 Unit Dashboard. */
export function BattleSettingsManager() {
  const token = useAdminToken();
  const toast = useToast();
  const [config, setConfig] = useState<BattleConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    battleApi
      .getConfig(token)
      .then(setConfig)
      .catch((err: unknown) => toast(errorMessage(err, "Gagal memuat pengaturan."), "error"));
  }, [token, toast]);

  if (!config) return <p className="text-sm font-medium text-muted">Memuat...</p>;

  const setTeam = (team: TeamId, patch: Partial<BattleConfig["teams"][TeamId]>) =>
    setConfig({ ...config, teams: { ...config.teams, [team]: { ...config.teams[team], ...patch } } });
  const setUnit = (unit: (typeof UNIT_TYPES)[number], patch: Partial<UnitStats>) =>
    setConfig({ ...config, units: { ...config.units, [unit]: { ...config.units[unit], ...patch } } });

  const save = async () => {
    setSaving(true);
    try {
      const { rangeUnitPx: _r, speedUnitPx: _s, ...editable } = config;
      setConfig(await battleApi.updateConfig(token, editable));
      toast("Pengaturan battle disimpan. Stat unit berlaku untuk unit baru; HP base/tower mulai match berikutnya.", "success");
    } catch (err) {
      toast(errorMessage(err, "Gagal menyimpan."), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl space-y-6">
      <AdminPageHeader
        title="Tim & Unit"
        description="Atur nama/warna tim, aturan match, dan statistik setiap unit. Semua angka bisa diubah tanpa mengubah kode (PRD §33)."
      />

      <Card>
        <CardTitle>Tim</CardTitle>
        <div className="grid gap-4 md:grid-cols-2">
          {(["A", "B"] as const).map((team) => (
            <div key={team} className="grid grid-cols-[1fr_90px_90px] gap-2 rounded-nb-sm border-3 border-ink p-3" style={{ background: `${config.teams[team].color}1A` }}>
              <label>
                <span className="nb-label mb-1 block">Nama Team {team}</span>
                <input value={config.teams[team].name} maxLength={24} onChange={(e) => setTeam(team, { name: e.target.value })} className="nb-input" />
              </label>
              <label>
                <span className="nb-label mb-1 block">Emblem</span>
                <input value={config.teams[team].emblem} maxLength={8} onChange={(e) => setTeam(team, { emblem: e.target.value })} className="nb-input text-center" />
              </label>
              <label>
                <span className="nb-label mb-1 block">Warna</span>
                <input type="color" value={config.teams[team].color} onChange={(e) => setTeam(team, { color: e.target.value.toUpperCase() })} className="nb-input h-[42px] p-1" />
              </label>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardTitle>Aturan match</CardTitle>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {BATTLE_FIELDS.map((f) => (
            <label key={f.key}>
              <span className="nb-label mb-1 block">{f.label}</span>
              <input
                type="number"
                step={f.step ?? 1}
                value={config[f.key]}
                onChange={(e) => setConfig({ ...config, [f.key]: Number(e.target.value) })}
                className="nb-input"
              />
              {f.hint && <span className="mt-0.5 block text-[11px] text-muted">{f.hint}</span>}
            </label>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-4">
          {(
            [
              ["suddenDeath", "Sudden Death saat HP seri (base damage ×2)"],
              ["autoNextMatch", "Match berikutnya mulai otomatis"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm font-bold">
              <input type="checkbox" checked={config[key]} onChange={(e) => setConfig({ ...config, [key]: e.target.checked })} className="h-5 w-5 accent-ink" />
              {label}
            </label>
          ))}
        </div>
      </Card>

      <Card padded={false} className="overflow-x-auto">
        <div className="border-b-3 border-ink px-5 py-3">
          <CardTitle className="mb-0">Statistik unit (PRD §8)</CardTitle>
          <p className="mt-1 text-xs font-medium text-muted">
            Jeda serang = detik antar serangan. × bangunan = pengali damage ke tower/base (unit spesialis bangunan: Heavy & Siege).
          </p>
        </div>
        <table className="w-full min-w-[1000px] text-sm">
          <thead>
            <tr className="bg-paper text-left text-[11px] font-black uppercase">
              <th className="px-3 py-2">Unit</th>
              {UNIT_FIELDS.map((f) => (
                <th key={f.key} className="px-1 py-2">
                  {f.label}
                </th>
              ))}
              <th className="px-1 py-2">Target</th>
              <th className="px-1 py-2">Skor spawn</th>
            </tr>
          </thead>
          <tbody>
            {UNIT_TYPES.map((unit) => (
              <tr key={unit} className="border-t-2 border-ink">
                <td className="px-3 py-1.5">
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/battle/portraits/A_${unit}.png`} alt="" className="h-9 w-9 rounded-full bg-blue/30" />
                    <div>
                      <div className="font-bold">{UNIT_META[unit].label}</div>
                      <div className="text-[10px] text-muted">{UNIT_META[unit].ability}</div>
                    </div>
                  </div>
                </td>
                {UNIT_FIELDS.map((f) => (
                  <td key={f.key} className="px-1 py-1.5">
                    <input
                      type="number"
                      step={f.step}
                      value={config.units[unit][f.key]}
                      onChange={(e) => setUnit(unit, { [f.key]: Number(e.target.value) })}
                      className="nb-input h-9 w-[84px] px-2 font-mono text-xs"
                    />
                  </td>
                ))}
                <td className="px-1 py-1.5">
                  <select
                    value={config.units[unit].targetPriority}
                    onChange={(e) => setUnit(unit, { targetPriority: e.target.value as UnitStats["targetPriority"] })}
                    className="nb-input h-9 px-1 text-xs"
                  >
                    {Object.entries(PRIORITY_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-1 py-1.5">
                  <input
                    type="number"
                    value={config.spawnScore[unit]}
                    onChange={(e) => setConfig({ ...config, spawnScore: { ...config.spawnScore, [unit]: Number(e.target.value) } })}
                    className="nb-input h-9 w-[72px] px-2 font-mono text-xs"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="flex justify-between gap-3">
        <Button variant="danger" size="sm" onClick={() => setConfirmReset(true)}>
          Kembalikan default
        </Button>
        <Button size="lg" disabled={saving} onClick={() => void save()}>
          {saving ? "Menyimpan..." : "💾 Simpan pengaturan"}
        </Button>
      </div>

      <Modal
        open={confirmReset}
        title="Kembalikan pengaturan default?"
        tone="danger"
        confirmLabel="Ya, reset"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          battleApi
            .resetConfig(token)
            .then((c) => {
              setConfig(c);
              setConfirmReset(false);
              toast("Pengaturan dikembalikan ke default.", "success");
            })
            .catch((err: unknown) => toast(errorMessage(err, "Gagal reset."), "error"));
        }}
      >
        <p>Nama tim, aturan match, dan semua statistik unit kembali ke nilai bawaan.</p>
      </Modal>
    </div>
  );
}

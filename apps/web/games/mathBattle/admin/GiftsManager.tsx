"use client";

import { useCallback, useEffect, useState } from "react";
import type { MathBattleGiftMapping, MathBattleGiftTier, MathBattleTeamId } from "@tebak-kata/shared";
import { mathBattleApi } from "../api";
import { errorMessage } from "@/lib/errors";
import { useAdminToken } from "@/lib/hostTokenContext";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { AdminPageHeader } from "@/components/shell/AdminPageHeader";

export function MathBattleGiftsManager() {
  const token = useAdminToken();
  const toast = useToast();
  const [gifts, setGifts] = useState<MathBattleGiftMapping[]>([]);
  const [loading, setLoading] = useState(true);

  const [giftName, setGiftName] = useState("");
  const [giftId, setGiftId] = useState("");
  const [team, setTeam] = useState<MathBattleTeamId | "NEUTRAL">("BLUE");
  const [tier, setTier] = useState<MathBattleGiftTier>("SMALL");
  const [power, setPower] = useState<number>(5);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setGifts(await mathBattleApi.gifts(token));
    } catch (err) {
      toast(errorMessage(err, "Gagal memuat gift."), "error");
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleTierChange = (newTier: MathBattleGiftTier) => {
    setTier(newTier);
    if (newTier === "SMALL") setPower(5);
    else if (newTier === "MEDIUM") setPower(15);
    else if (newTier === "LARGE") setPower(40);
    else if (newTier === "NEUTRAL") setPower(0);
  };

  const add = async () => {
    if (!giftName.trim()) return;
    setSaving(true);
    try {
      await mathBattleApi.saveGift(token, {
        giftName: giftName.trim(),
        giftId: giftId.trim() || null,
        team,
        tier,
        power: Number(power),
        enabled: true,
      });
      setGiftName("");
      setGiftId("");
      toast("Gift Tarik Tambang berhasil disimpan.", "success");
      await refresh();
    } catch (err) {
      toast(errorMessage(err, "Gagal menyimpan gift."), "error");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (g: MathBattleGiftMapping) => {
    try {
      await mathBattleApi.saveGift(token, {
        id: g.id,
        giftName: g.giftName,
        giftId: g.giftId,
        team: g.team,
        tier: g.tier,
        power: g.power,
        enabled: !g.enabled,
      });
      toast(`Gift “${g.giftName}” diperbarui.`, "success");
      await refresh();
    } catch (err) {
      toast(errorMessage(err, "Gagal mengubah status gift."), "error");
    }
  };

  const resetDefaults = async () => {
    if (!window.confirm("Ganti semua mapping dengan gift TikTok bawaan (Rose, TikTok, dll)?")) return;
    try {
      await mathBattleApi.resetGifts(token);
      toast("Mapping gift dikembalikan ke default.", "success");
      await refresh();
    } catch (err) {
      toast(errorMessage(err, "Gagal reset mapping."), "error");
    }
  };

  const remove = async (g: MathBattleGiftMapping) => {
    try {
      await mathBattleApi.deleteGift(token, g.id);
      toast(`Gift “${g.giftName}” dihapus.`, "success");
      await refresh();
    } catch (err) {
      toast(errorMessage(err, "Gagal menghapus gift."), "error");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Gift Tarik Tambang LIVE"
        description="Gift TikTok → power untuk Tim Biru atau Tim Merah. Gift dicocokkan lewat Gift ID TikTok, atau lewat nama gift kalau ID kosong. Power × jumlah combo ditambahkan ke ronde yang sedang berjalan (atau disimpan untuk ronde berikutnya)."
        count={gifts.length}
      />
      <div className="flex justify-end">
        <Button variant="secondary" size="sm" onClick={() => void resetDefaults()}>
          ↺ Kembalikan gift default
        </Button>
      </div>

      {/* Add Form */}
      <Card tone="white">
        <CardTitle>Tambah Pemetaan Gift</CardTitle>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-7">
          <div className="sm:col-span-2">
            <label className="text-xs font-bold uppercase text-muted">Nama Gift</label>
            <input
              type="text"
              placeholder="Contoh: Rose"
              value={giftName}
              onChange={(e) => setGiftName(e.target.value)}
              className="mt-1 w-full rounded border-2 border-ink bg-paper p-2 font-bold"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-muted">Gift ID (Opsional)</label>
            <input
              type="text"
              placeholder="5655"
              value={giftId}
              onChange={(e) => setGiftId(e.target.value)}
              className="mt-1 w-full rounded border-2 border-ink bg-paper p-2 font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-muted">Tim</label>
            <select
              value={team}
              onChange={(e) => setTeam(e.target.value as MathBattleTeamId | "NEUTRAL")}
              className="mt-1 w-full rounded border-2 border-ink bg-paper p-2 font-bold"
            >
              <option value="BLUE">🔵 Tim Biru</option>
              <option value="RED">🔴 Tim Merah</option>
              <option value="NEUTRAL">⚪ Netral</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-muted">Tier & Power</label>
            <select
              value={tier}
              onChange={(e) => handleTierChange(e.target.value as MathBattleGiftTier)}
              className="mt-1 w-full rounded border-2 border-ink bg-paper p-2 font-bold"
            >
              <option value="SMALL">Small (+5)</option>
              <option value="MEDIUM">Medium (+15)</option>
              <option value="LARGE">Large (+40)</option>
              <option value="NEUTRAL">Neutral (0)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-muted">Power / gift</label>
            <input
              type="number"
              min={0}
              value={power}
              onChange={(e) => setPower(Math.max(0, Math.round(Number(e.target.value) || 0)))}
              className="mt-1 w-full rounded border-2 border-ink bg-paper p-2 font-mono font-bold"
            />
          </div>

          <div className="flex items-end">
            <Button
              variant="primary"
              className="w-full"
              disabled={saving || !giftName.trim()}
              onClick={add}
            >
              {saving ? "Menyimpan..." : "+ Tambah"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card tone="white">
        <CardTitle>Daftar Pemetaan Gift ({gifts.length})</CardTitle>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b-2 border-ink text-xs font-black uppercase text-muted">
                <th className="py-2">Nama Gift</th>
                <th className="py-2">Gift ID</th>
                <th className="py-2">Tim</th>
                <th className="py-2">Tier</th>
                <th className="py-2">Power</th>
                <th className="py-2">Status</th>
                <th className="py-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-muted">
                    Memuat gift...
                  </td>
                </tr>
              ) : gifts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-muted">
                    Belum ada mapping gift.
                  </td>
                </tr>
              ) : (
                gifts.map((g) => {
                  const isBlue = g.team === "BLUE";
                  const isRed = g.team === "RED";
                  return (
                    <tr key={g.id} className="border-b border-ink/20">
                      <td className="py-3 font-bold">{g.giftName}</td>
                      <td className="py-3 font-mono text-xs text-muted">{g.giftId ?? "cocok via nama"}</td>
                      <td className="py-3">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-bold ${
                            isBlue
                              ? "bg-[#dbeafe] text-[#1d4ed8]"
                              : isRed
                                ? "bg-[#fee2e2] text-[#b91c1c]"
                                : "bg-paper text-ink"
                          }`}
                        >
                          {isBlue ? "🔵 Biru" : isRed ? "🔴 Merah" : "⚪ Netral"}
                        </span>
                      </td>
                      <td className="py-3 font-bold">{g.tier}</td>
                      <td className="py-3 font-mono font-bold text-amber-700">+{g.power}</td>
                      <td className="py-3">
                        <button
                          onClick={() => toggle(g)}
                          className={`rounded px-2 py-0.5 text-xs font-bold ${
                            g.enabled ? "bg-green/30 text-[#166534]" : "bg-red/20 text-[#991b1b]"
                          }`}
                        >
                          {g.enabled ? "Aktif" : "Nonaktif"}
                        </button>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => remove(g)}
                          className="rounded border border-ink/40 bg-white px-2 py-1 text-xs font-bold text-red hover:bg-[#fee2e2]"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

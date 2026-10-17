"use client";

import { useEffect, useState } from "react";
import { DEFAULT_LIVE_TIMER, type SessionSettings } from "@tebak-kata/shared";
import { api } from "@/lib/api";
import { coinRuleLabel } from "@/lib/useLiveCountdown";
import { errorMessage } from "@/lib/errors";
import { useAdminToken } from "@/lib/hostTokenContext";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { ErrorNote } from "@/components/ui/ErrorNote";
import { useToast } from "@/components/ui/Toast";
import { AdminPageHeader } from "@/components/shell/AdminPageHeader";

const SCORING_LABEL: Record<keyof SessionSettings["scoring"], string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  boss: "Boss",
};

/** PRD section 13.2 — scoring "dapat diubah melalui konfigurasi admin". */
export function SettingsManager() {
  const token = useAdminToken();
  const toast = useToast();
  const [settings, setSettings] = useState<SessionSettings | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .getSettings(token)
      .then(setSettings)
      .catch((err) => setLoadError(errorMessage(err, "Gagal memuat pengaturan.")));
  }, [token]);

  if (loadError) return <ErrorNote message={loadError} className="max-w-xl" />;
  if (!settings) return <p className="text-sm font-medium text-muted">Memuat pengaturan...</p>;

  const save = async () => {
    setSaving(true);
    try {
      setSettings(await api.updateSettings(token, settings));
      toast("Pengaturan disimpan.", "success");
    } catch (err) {
      toast(errorMessage(err, "Gagal menyimpan pengaturan."), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <AdminPageHeader title="Pengaturan" description="Skor Tebak Kata, sumber komentar/gift, dan timer sesi LIVE. Tersimpan permanen dan berlaku untuk sesi berikutnya." />

      <Card>
        <CardTitle>Skor Tebak Kata</CardTitle>
        <div className="grid grid-cols-2 gap-4">
          {(Object.keys(SCORING_LABEL) as Array<keyof SessionSettings["scoring"]>).map((key) => (
            <label key={key} className="block">
              <span className="nb-label mb-1.5 block">{SCORING_LABEL[key]}</span>
              <input
                type="number"
                min={1}
                value={settings.scoring[key]}
                onChange={(e) => setSettings({ ...settings, scoring: { ...settings.scoring, [key]: Number(e.target.value) } })}
                className="nb-input font-mono"
              />
            </label>
          ))}
        </div>
      </Card>

      <Card>
        <CardTitle>Gameplay</CardTitle>
        <label className="mb-4 block">
          <span className="nb-label mb-1.5 block">Boss setiap N kata terjawab</span>
          <input
            type="number"
            min={1}
            value={settings.bossEveryNWords}
            onChange={(e) => setSettings({ ...settings, bossEveryNWords: Number(e.target.value) })}
            className="nb-input font-mono"
          />
        </label>
        <label className="mb-4 block">
          <span className="nb-label mb-1.5 block">Jeda anti-pengulangan kata (puzzle)</span>
          <input
            type="number"
            min={0}
            value={settings.antiRepeatWindow}
            onChange={(e) => setSettings({ ...settings, antiRepeatWindow: Number(e.target.value) })}
            className="nb-input font-mono"
          />
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-nb-sm border-2 border-ink bg-paper p-3">
          <input
            type="checkbox"
            className="mt-0.5 h-5 w-5 shrink-0 accent-ink"
            checked={settings.mockTikTokEnabled}
            onChange={(e) => setSettings({ ...settings, mockTikTokEnabled: e.target.checked })}
          />
          <span className="text-sm font-medium">
            <span className="block font-bold">Aktifkan sumber komentar & gift</span>
            Menjalankan sumber yang dipilih server lewat <code className="font-mono text-xs">LIVE_SOURCE</code> — TikTok LIVE asli atau simulasi.
          </span>
        </label>
      </Card>

      <Card>
        <CardTitle>Gift Goal (Boss Round)</CardTitle>
        <label className="mb-2 block">
          <span className="nb-label mb-1.5 block">Target Koin Gift Default (Per Tier)</span>
          <input
            type="number"
            min={1}
            max={50000}
            value={settings.giftGoalCoins ?? 100}
            onChange={(e) => setSettings({ ...settings, giftGoalCoins: Math.max(1, Number(e.target.value) || 1) })}
            className="nb-input font-mono"
          />
        </label>
        <p className="text-xs font-medium text-muted">
          Saat total koin gift penonton mencapai target ini, ronde/puzzle berikutnya otomatis menjadi Boss Round (poin berlipat ganda).
        </p>
      </Card>

      <LiveTimerCard settings={settings} onChange={setSettings} />

      <Button size="lg" onClick={() => void save()} disabled={saving}>
        {saving ? "Menyimpan..." : "Simpan pengaturan"}
      </Button>
    </div>
  );
}

function LiveTimerCard({ settings, onChange }: { settings: SessionSettings; onChange: (s: SessionSettings) => void }) {
  const timer = { ...DEFAULT_LIVE_TIMER, ...settings.liveTimer };
  const set = (patch: Partial<typeof timer>) => onChange({ ...settings, liveTimer: { ...timer, ...patch } });
  return (
    <Card>
      <CardTitle>Timer sesi LIVE</CardTitle>
      <label className="mb-4 flex cursor-pointer items-center gap-3">
        <input type="checkbox" className="h-5 w-5 accent-ink" checked={timer.enabled} onChange={(e) => set({ enabled: e.target.checked })} />
        <span className="text-sm font-bold">Aktifkan hitung mundur sesi (gift menambah waktu)</span>
      </label>
      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="nb-label mb-1.5 block">Durasi awal (menit)</span>
          <input type="number" min={1} max={1440} value={timer.initialMinutes} onChange={(e) => set({ initialMinutes: Math.max(1, Number(e.target.value) || 1) })} className="nb-input font-mono" disabled={!timer.enabled} />
        </label>
        <label className="block">
          <span className="nb-label mb-1.5 block">Detik per 1 koin gift</span>
          <input type="number" min={0} max={3600} value={timer.secondsPerCoin} onChange={(e) => set({ secondsPerCoin: Math.max(0, Number(e.target.value) || 0) })} className="nb-input font-mono" disabled={!timer.enabled} />
        </label>
      </div>
      <p className="mt-2 text-xs font-medium text-muted">
        Ditampilkan ke penonton sebagai &quot;{coinRuleLabel(timer.secondsPerCoin)}&quot;. Saat waktu habis, sesi dijeda 2 menit menunggu gift sebelum berakhir otomatis.
      </p>
    </Card>
  );
}

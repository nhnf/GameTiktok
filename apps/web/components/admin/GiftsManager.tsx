"use client";

import { useCallback, useEffect, useState } from "react";
import { api, type GiftDTO } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { useAdminToken } from "@/lib/hostTokenContext";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { AdminPageHeader } from "@/components/shell/AdminPageHeader";

/** PRD section 19.2 — Gift Configuration: gift identifier, name, effect, enabled/disabled. */
export function GiftsManager() {
  const token = useAdminToken();
  const toast = useToast();
  const [gifts, setGifts] = useState<GiftDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [giftId, setGiftId] = useState("");
  const [giftName, setGiftName] = useState("");
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setGifts(await api.gifts.list(token));
    } catch (err) {
      toast(errorMessage(err, "Gagal memuat gift."), "error");
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const add = async () => {
    if (!giftId.trim() || !giftName.trim()) return;
    setSaving(true);
    try {
      await api.gifts.create(token, { giftId: giftId.trim(), giftName: giftName.trim(), effect: "REVEAL_NEXT_LETTER", enabled: true });
      setGiftId("");
      setGiftName("");
      toast("Gift ditambahkan.", "success");
      await refresh();
    } catch (err) {
      toast(errorMessage(err, "Gagal menambah gift."), "error");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (gift: GiftDTO) => {
    try {
      await api.gifts.update(token, gift.id, { enabled: !gift.enabled });
      toast(`${gift.giftName} ${gift.enabled ? "dinonaktifkan" : "diaktifkan"}.`, "success");
      await refresh();
    } catch (err) {
      toast(errorMessage(err, "Gagal mengubah gift."), "error");
    }
  };

  const remove = async (gift: GiftDTO) => {
    try {
      await api.gifts.remove(token, gift.id);
      toast(`Gift “${gift.giftName}” dihapus.`, "success");
      await refresh();
    } catch (err) {
      toast(errorMessage(err, "Gagal menghapus gift."), "error");
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <AdminPageHeader
        title="Gift"
        description="Setiap gift aktif membuka satu huruf berikutnya saat diterima (REVEAL_NEXT_LETTER). Gift yang tidak terdaftar diabaikan game engine."
        count={gifts.length}
      />

      <Card>
        <CardTitle>Tambah gift</CardTitle>
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void add();
          }}
        >
          <label className="min-w-[160px] flex-1">
            <span className="nb-label mb-1.5 block">Gift ID</span>
            <input value={giftId} onChange={(e) => setGiftId(e.target.value)} placeholder="mis. 5655" className="nb-input" />
          </label>
          <label className="min-w-[160px] flex-1">
            <span className="nb-label mb-1.5 block">Nama tampilan</span>
            <input value={giftName} onChange={(e) => setGiftName(e.target.value)} placeholder="mis. Rose" className="nb-input" />
          </label>
          <Button type="submit" disabled={saving || !giftId.trim() || !giftName.trim()}>
            + Tambah
          </Button>
        </form>
      </Card>

      <Card padded={false} className="overflow-hidden">
        {loading ? (
          <p className="p-5 text-sm font-medium text-muted">Memuat...</p>
        ) : gifts.length === 0 ? (
          <p className="p-5 text-sm font-medium text-muted">Belum ada gift dikonfigurasi.</p>
        ) : (
          <ul>
            {gifts.map((gift, index) => (
              <li
                key={gift.id}
                className={`flex items-center justify-between gap-3 px-5 py-3 ${index > 0 ? "border-t-2 border-ink" : ""} ${index % 2 === 1 ? "bg-paper" : "bg-white"}`}
              >
                <div className="min-w-0">
                  <div className="truncate font-bold">{gift.giftName}</div>
                  <div className="font-mono text-xs text-muted">
                    id: {gift.giftId} · {gift.effect}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={gift.enabled}
                    onClick={() => void toggle(gift)}
                    className={`h-9 rounded-full border-2 border-ink px-3 text-xs font-bold uppercase shadow-nb-sm ${gift.enabled ? "bg-green" : "bg-white text-muted"}`}
                  >
                    {gift.enabled ? "● Aktif" : "○ Nonaktif"}
                  </button>
                  <Button size="sm" variant="danger" onClick={() => void remove(gift)}>
                    Hapus
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

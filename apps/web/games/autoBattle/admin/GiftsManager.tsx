"use client";

import { useCallback, useEffect, useState } from "react";
import { findGiftMapping, type BattleGiftMapping } from "@tebak-kata/shared";
import { battleApi, type BattleMappingInput, type SeenGiftDTO } from "../api";
import { EMPTY_FORM } from "./giftIcons";
import { MappingForm } from "./MappingForm";
import { MappingLists } from "./MappingLists";
import { SeenGiftsCard } from "./SeenGiftsCard";
import { errorMessage } from "@/lib/errors";
import { useAdminToken } from "@/lib/hostTokenContext";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { AdminPageHeader } from "@/components/shell/AdminPageHeader";

export function BattleGiftsManager() {
  const token = useAdminToken();
  const toast = useToast();
  const [mappings, setMappings] = useState<BattleGiftMapping[]>([]);
  const [seen, setSeen] = useState<SeenGiftDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<BattleMappingInput>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [m, s] = await Promise.all([battleApi.mappings.list(token), battleApi.seenGifts(token)]);
      setMappings(m);
      setSeen(s);
    } catch (err) {
      toast(errorMessage(err, "Gagal memuat data gift."), "error");
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const save = async () => {
    if (!form.giftName.trim()) return;
    setSaving(true);
    const body = { ...form, giftId: form.giftId?.trim() || null, giftName: form.giftName.trim() };
    try {
      if (editingId) await battleApi.mappings.update(token, editingId, body);
      else await battleApi.mappings.create(token, body);
      toast(editingId ? "Mapping diperbarui." : "Mapping ditambahkan.", "success");
      setForm(EMPTY_FORM);
      setEditingId(null);
      await refresh();
    } catch (err) {
      toast(errorMessage(err, "Gagal menyimpan mapping."), "error");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (m: BattleGiftMapping) => {
    try {
      await battleApi.mappings.update(token, m.id, { enabled: !m.enabled });
      await refresh();
    } catch (err) {
      toast(errorMessage(err, "Gagal mengubah mapping."), "error");
    }
  };

  const remove = async (m: BattleGiftMapping) => {
    try {
      await battleApi.mappings.remove(token, m.id);
      toast(`Mapping "${m.giftName}" dihapus.`, "success");
      await refresh();
    } catch (err) {
      toast(errorMessage(err, "Gagal menghapus mapping."), "error");
    }
  };

  const edit = (m: BattleGiftMapping) => {
    setEditingId(m.id);
    setForm({
      giftId: m.giftId ?? "",
      giftName: m.giftName,
      team: m.team,
      unitType: m.unitType,
      quantity: m.quantity,
      enabled: m.enabled,
      diamondCount: m.diamondCount ?? null,
      imageUrl: m.imageUrl ?? null,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const mapSeen = (g: SeenGiftDTO) => {
    const existing = findGiftMapping(mappings, g.giftId, g.giftName);
    if (existing) {
      // Same gift already mapped by name: attach the real id to it.
      edit({ ...existing, giftId: existing.giftId ?? g.giftId, diamondCount: existing.diamondCount ?? g.diamondCount, imageUrl: existing.imageUrl ?? g.imageUrl });
      return;
    }
    setEditingId(null);
    setForm({ ...EMPTY_FORM, giftId: g.giftId, giftName: g.giftName, diamondCount: g.diamondCount, imageUrl: g.imageUrl });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetDefaults = async () => {
    try {
      await battleApi.mappings.resetDefaults(token);
      toast("Mapping dikembalikan ke default.", "success");
      setConfirmReset(false);
      await refresh();
    } catch (err) {
      toast(errorMessage(err, "Gagal reset mapping."), "error");
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <AdminPageHeader
        title="Gift → Pasukan"
        description="Setiap gift menentukan TIM dan UNIT yang dipanggil (PRD §13). Penonton tidak memilih tim — gift yang menentukan, jadi satu penonton boleh membantu kedua tim. Gift dicocokkan lewat Gift ID TikTok; kalau ID kosong/berbeda, dicocokkan lewat nama gift."
        count={mappings.length}
      />

      <MappingForm token={token} form={form} setForm={setForm} editingId={editingId} setEditingId={setEditingId} saving={saving} save={save} />

      <MappingLists mappings={mappings} loading={loading} toggle={toggle} edit={edit} remove={remove} />

      <SeenGiftsCard token={token} seen={seen} mappings={mappings} refresh={refresh} mapSeen={mapSeen} />

      <div className="flex justify-end">
        <Button variant="danger" size="sm" onClick={() => setConfirmReset(true)}>
          Kembalikan mapping default
        </Button>
      </div>

      <Modal
        open={confirmReset}
        title="Kembalikan mapping default?"
        tone="danger"
        confirmLabel="Ya, reset"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => void resetDefaults()}
      >
        <p>Semua mapping yang ada akan diganti dengan 16 mapping bawaan (8 unit × 2 tim).</p>
      </Modal>
    </div>
  );
}

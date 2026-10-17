"use client";

import { UNIT_META, UNIT_TYPES, type TeamId, type UnitType } from "@tebak-kata/shared";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import type { BattleMappingInput } from "../api";
import { CatalogPicker } from "./CatalogPicker";
import { EMPTY_FORM, GiftIcon, TEAM_LABEL, UnitIcon } from "./giftIcons";

interface MappingFormProps {
  token: string;
  form: BattleMappingInput;
  setForm: (form: BattleMappingInput) => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  saving: boolean;
  save: () => Promise<void>;
}

/** Add / edit one gift → team → unit mapping. */
export function MappingForm({ token, form, setForm, editingId, setEditingId, saving, save }: MappingFormProps) {
  return (
      <Card>
        <CardTitle>{editingId ? "Edit mapping" : "Tambah mapping"}</CardTitle>
        <div className="mb-3">
          <CatalogPicker
            token={token}
            onPick={(g) => setForm({ ...form, giftId: g.id, giftName: g.name, diamondCount: g.diamondCount, imageUrl: g.imageUrl })}
          />
          <p className="mt-1 text-[11px] font-medium text-muted">Pilih dari katalog resmi TikTok — ID, nama, harga koin & ikon terisi otomatis. Atau isi manual di bawah.</p>
        </div>
        <form
          className="grid grid-cols-2 gap-3 md:grid-cols-6"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <label className="col-span-2 md:col-span-1">
            <span className="nb-label mb-1.5 block">Gift ID</span>
            <input value={form.giftId ?? ""} onChange={(e) => setForm({ ...form, giftId: e.target.value })} placeholder="5655" className="nb-input" />
          </label>
          <label className="col-span-2">
            <span className="nb-label mb-1.5 block">Nama gift</span>
            <input value={form.giftName} onChange={(e) => setForm({ ...form, giftName: e.target.value })} placeholder="Rose" className="nb-input" />
          </label>
          <label>
            <span className="nb-label mb-1.5 block">Tim</span>
            <select value={form.team} onChange={(e) => setForm({ ...form, team: e.target.value as TeamId })} className="nb-input">
              <option value="A">A · Biru</option>
              <option value="B">B · Merah</option>
            </select>
          </label>
          <label>
            <span className="nb-label mb-1.5 block">Unit</span>
            <select value={form.unitType} onChange={(e) => setForm({ ...form, unitType: e.target.value as UnitType })} className="nb-input">
              {UNIT_TYPES.map((u) => (
                <option key={u} value={u}>
                  {UNIT_META[u].label} (T{UNIT_META[u].tier})
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="nb-label mb-1.5 block">Jumlah</span>
            <input
              type="number"
              min={1}
              max={50}
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: Math.max(1, Math.min(50, Number(e.target.value) || 1)) })}
              className="nb-input"
            />
          </label>
          <div className="col-span-2 flex items-center gap-3 md:col-span-6">
            <GiftIcon url={form.imageUrl} size={36} />
            <span className="text-lg font-black">➜</span>
            <UnitIcon team={form.team} unit={form.unitType} size={40} />
            <span className="text-sm font-bold">
              {form.giftName || "Gift"} → {TEAM_LABEL[form.team]} → {UNIT_META[form.unitType].label} ×{form.quantity}
              <span className="ml-2 font-medium text-muted">({UNIT_META[form.unitType].role} · ability {UNIT_META[form.unitType].ability})</span>
            </span>
            <div className="ml-auto flex gap-2">
              {editingId && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditingId(null);
                    setForm(EMPTY_FORM);
                  }}
                >
                  Batal
                </Button>
              )}
              <Button type="submit" disabled={saving || !form.giftName.trim()}>
                {editingId ? "Simpan" : "+ Tambah"}
              </Button>
            </div>
          </div>
        </form>
      </Card>
  );
}

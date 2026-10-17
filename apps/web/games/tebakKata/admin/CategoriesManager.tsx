"use client";

import { useCallback, useEffect, useState } from "react";
import type { Category } from "@tebak-kata/shared";
import { tebakKataApi } from "../api";
import { errorMessage } from "@/lib/errors";
import { useAdminToken } from "@/lib/hostTokenContext";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { AdminPageHeader } from "@/components/shell/AdminPageHeader";

export function CategoriesManager() {
  const token = useAdminToken();
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setCategories(await tebakKataApi.categories.list(token));
    } catch (err) {
      toast(errorMessage(err, "Gagal memuat kategori."), "error");
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const add = async () => {
    if (!name.trim() || !emoji.trim()) return;
    setSaving(true);
    try {
      await tebakKataApi.categories.create(token, { name: name.trim(), emoji: emoji.trim() });
      setName("");
      setEmoji("");
      toast("Kategori ditambahkan.", "success");
      await refresh();
    } catch (err) {
      toast(errorMessage(err, "Gagal menambah kategori."), "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (category: Category) => {
    try {
      await tebakKataApi.categories.remove(token, category.id);
      toast(`Kategori “${category.name}” dihapus.`, "success");
      await refresh();
    } catch (err) {
      toast(errorMessage(err, "Gagal menghapus kategori."), "error");
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <AdminPageHeader title="Kategori" description="Kategori tampil di overlay sebagai petunjuk awal — bukan petunjuk jawaban." count={categories.length} />

      <Card>
        <CardTitle>Tambah kategori</CardTitle>
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void add();
          }}
        >
          <label className="w-20">
            <span className="nb-label mb-1.5 block">Emoji</span>
            <input value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="🔤" className="nb-input text-center text-lg" />
          </label>
          <label className="min-w-[200px] flex-1">
            <span className="nb-label mb-1.5 block">Nama</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="mis. Makanan" className="nb-input" />
          </label>
          <Button type="submit" disabled={saving || !name.trim() || !emoji.trim()}>
            + Tambah
          </Button>
        </form>
      </Card>

      <Card padded={false} className="overflow-hidden">
        {loading ? (
          <p className="p-5 text-sm font-medium text-muted">Memuat...</p>
        ) : categories.length === 0 ? (
          <p className="p-5 text-sm font-medium text-muted">Belum ada kategori.</p>
        ) : (
          <ul>
            {categories.map((category, index) => (
              <li
                key={category.id}
                className={`flex items-center justify-between gap-3 px-5 py-3 ${index > 0 ? "border-t-2 border-ink" : ""} ${index % 2 === 1 ? "bg-paper" : "bg-white"}`}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-nb-sm border-2 border-ink bg-white text-lg">{category.emoji}</span>
                  <span className="truncate font-bold">{category.name}</span>
                </span>
                <Button size="sm" variant="danger" onClick={() => void remove(category)}>
                  Hapus
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

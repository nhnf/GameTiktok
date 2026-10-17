"use client";

import { useCallback, useEffect, useState } from "react";
import type { TekaKataCategory } from "@tebak-kata/shared";
import { tekaKataApi } from "../api";
import { errorMessage } from "@/lib/errors";
import { useAdminToken } from "@/lib/hostTokenContext";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { AdminPageHeader } from "@/components/shell/AdminPageHeader";

export function TekaKataCategoriesManager() {
  const token = useAdminToken();
  const toast = useToast();
  const [categories, setCategories] = useState<TekaKataCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await tekaKataApi.categories.list(token);
      setCategories(data);
    } catch (err) {
      toast(errorMessage(err, "Gagal memuat kategori Susun Kata."), "error");
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const add = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await tekaKataApi.categories.create(token, {
        name: name.trim(),
        description: description.trim() || null,
        isActive: true,
      });
      setName("");
      setDescription("");
      toast("Kategori Susun Kata ditambahkan.", "success");
      await refresh();
    } catch (err) {
      toast(errorMessage(err, "Gagal menambah kategori."), "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item: TekaKataCategory) => {
    try {
      await tekaKataApi.categories.update(token, item.id, { isActive: !item.isActive });
      toast(`Kategori “${item.name}” diperbarui.`, "success");
      await refresh();
    } catch (err) {
      toast(errorMessage(err, "Gagal mengubah kategori."), "error");
    }
  };

  const remove = async (item: TekaKataCategory) => {
    if (!confirm(`Hapus kategori "${item.name}"?`)) return;
    try {
      await tekaKataApi.categories.remove(token, item.id);
      toast(`Kategori “${item.name}” dihapus.`, "success");
      await refresh();
    } catch (err) {
      toast(errorMessage(err, "Gagal menghapus kategori."), "error");
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <AdminPageHeader
        title="Kategori — Susun Kata"
        description="Kelola kategori tema puzzle Susun Kata LIVE."
        count={categories.length}
      />

      <Card>
        <CardTitle>Tambah Kategori Baru</CardTitle>
        <form
          className="flex flex-wrap items-end gap-3 pt-2"
          onSubmit={(e) => {
            e.preventDefault();
            void add();
          }}
        >
          <label className="min-w-[180px] flex-1">
            <span className="nb-label mb-1.5 block">Nama Kategori</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Teknologi"
              className="nb-input"
            />
          </label>
          <label className="min-w-[240px] flex-1">
            <span className="nb-label mb-1.5 block">Deskripsi (Opsional)</span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Istilah teknologi dan komputer"
              className="nb-input"
            />
          </label>
          <Button type="submit" disabled={saving || !name.trim()}>
            + Tambah Kategori
          </Button>
        </form>
      </Card>

      <Card padded={false} className="overflow-x-auto">
        {loading ? (
          <p className="p-5 text-sm font-medium text-muted">Memuat...</p>
        ) : categories.length === 0 ? (
          <p className="p-5 text-sm font-medium text-muted">Belum ada kategori Susun Kata.</p>
        ) : (
          <table className="w-full min-w-[500px] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-ink text-xs uppercase tracking-wider text-yellow">
                <th className="px-4 py-3 font-bold">Nama Kategori</th>
                <th className="px-4 py-3 font-bold">Deskripsi</th>
                <th className="px-4 py-3 text-right font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((item, index) => (
                <tr
                  key={item.id}
                  className={`border-t-2 border-ink ${
                    index % 2 === 1 ? "bg-paper" : "bg-white"
                  } ${item.isActive ? "" : "text-muted opacity-60"}`}
                >
                  <td className="px-4 py-3 font-bold">
                    <span className="font-display text-base uppercase">{item.name}</span>
                    {!item.isActive && (
                      <span className="ml-2 rounded-full border-2 border-ink bg-white px-2 text-[10px] font-bold uppercase text-ink">
                        Nonaktif
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">{item.description ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => void toggleActive(item)}
                      >
                        {item.isActive ? "Nonaktifkan" : "Aktifkan"}
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => void remove(item)}>
                        Hapus
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import type { Category, Difficulty } from "@tebak-kata/shared";
import { tebakKataApi, type WordDTO } from "../api";
import { errorMessage } from "@/lib/errors";
import { useAdminToken } from "@/lib/hostTokenContext";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { DifficultyBadge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { AdminPageHeader } from "@/components/shell/AdminPageHeader";

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard", "boss"];

export function WordsManager() {
  const token = useAdminToken();
  const toast = useToast();
  const [words, setWords] = useState<WordDTO[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [word, setWord] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setWords(await tebakKataApi.words.list(token));
    } catch (err) {
      toast(errorMessage(err, "Gagal memuat kata."), "error");
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    void refresh();
    tebakKataApi.categories
      .list(token)
      .then((cats) => {
        setCategories(cats);
        if (cats[0]) setCategoryId((current) => current || cats[0].id);
      })
      .catch((err) => toast(errorMessage(err, "Gagal memuat kategori."), "error"));
  }, [refresh, token, toast]);

  const add = async () => {
    if (!word.trim() || !categoryId) return;
    setSaving(true);
    try {
      await tebakKataApi.words.create(token, { word, categoryId, difficulty });
      setWord("");
      toast("Kata ditambahkan.", "success");
      await refresh();
    } catch (err) {
      toast(errorMessage(err, "Gagal menambah kata."), "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item: WordDTO) => {
    try {
      await tebakKataApi.words.update(token, item.id, { isActive: !item.isActive });
      toast(`“${item.word}” ${item.isActive ? "dinonaktifkan" : "diaktifkan"}.`, "success");
      await refresh();
    } catch (err) {
      toast(errorMessage(err, "Gagal mengubah kata."), "error");
    }
  };

  const remove = async (item: WordDTO) => {
    try {
      await tebakKataApi.words.remove(token, item.id);
      toast(`“${item.word}” dihapus.`, "success");
      await refresh();
    } catch (err) {
      toast(errorMessage(err, "Gagal menghapus kata."), "error");
    }
  };

  const [syncing, setSyncing] = useState(false);

  const handleSyncFromSusunKata = async () => {
    if (!confirm("Salin seluruh kata dari Susun Kata ke Tebak Kata?")) return;
    setSyncing(true);
    try {
      const res = await tebakKataApi.words.syncFromSusunKata(token);
      toast(`Berhasil menyalin ${res.copiedCount} kata dari Susun Kata!`, "success");
      await refresh();
    } catch (err) {
      toast(errorMessage(err, "Gagal menyinkronkan kata."), "error");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <AdminPageHeader title="Kata" description="Daftar kata target. Kata nonaktif tidak akan dipilih game." count={words.length} />
        <Button
          variant="secondary"
          size="sm"
          onClick={handleSyncFromSusunKata}
          disabled={syncing}
        >
          {syncing ? "Menyalin..." : "⚡ Salin Kata dari Susun Kata"}
        </Button>
      </div>

      <Card>
        <CardTitle>Tambah kata</CardTitle>
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void add();
          }}
        >
          <label className="min-w-[180px] flex-1">
            <span className="nb-label mb-1.5 block">Kata</span>
            <input value={word} onChange={(e) => setWord(e.target.value)} placeholder="KATA" className="nb-input uppercase" />
          </label>
          <label className="min-w-[160px]">
            <span className="nb-label mb-1.5 block">Kategori</span>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="nb-input">
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.emoji} {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="min-w-[130px]">
            <span className="nb-label mb-1.5 block">Level</span>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)} className="nb-input">
              {DIFFICULTIES.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" disabled={saving || !word.trim() || !categoryId}>
            + Tambah
          </Button>
        </form>
      </Card>

      <Card padded={false} className="overflow-x-auto">
        {loading ? (
          <p className="p-5 text-sm font-medium text-muted">Memuat...</p>
        ) : words.length === 0 ? (
          <p className="p-5 text-sm font-medium text-muted">Belum ada kata.</p>
        ) : (
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-ink text-xs uppercase tracking-wider text-yellow">
                <th className="px-4 py-3 font-bold">Kata</th>
                <th className="px-4 py-3 font-bold">Kategori</th>
                <th className="px-4 py-3 font-bold">Level</th>
                <th className="px-4 py-3 text-right font-bold">Dipakai</th>
                <th className="px-4 py-3 text-right font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {words.map((item, index) => (
                <tr key={item.id} className={`border-t-2 border-ink ${index % 2 === 1 ? "bg-paper" : "bg-white"} ${item.isActive ? "" : "text-muted"}`}>
                  <td className="px-4 py-2.5">
                    <span className="font-display text-base uppercase tracking-wide">{item.word}</span>
                    {!item.isActive && <span className="ml-2 rounded-full border-2 border-ink bg-white px-2 text-[10px] font-bold uppercase text-ink">Nonaktif</span>}
                  </td>
                  <td className="px-4 py-2.5 font-medium">
                    {item.category ? (
                      <>
                        {item.category.emoji} {item.category.name}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <DifficultyBadge difficulty={item.difficulty} />
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold">{item.usageCount}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="secondary" onClick={() => void toggleActive(item)}>
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

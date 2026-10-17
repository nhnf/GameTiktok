"use client";

import { useCallback, useEffect, useState } from "react";
import type { TekaKataCategory, TekaKataDifficulty } from "@tebak-kata/shared";
import { tekaKataApi, type TekaKataWordDTO } from "../api";
import { errorMessage } from "@/lib/errors";
import { useAdminToken } from "@/lib/hostTokenContext";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { DifficultyBadge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { AdminPageHeader } from "@/components/shell/AdminPageHeader";

const DIFFICULTIES: TekaKataDifficulty[] = ["easy", "medium", "hard", "boss"];

export function TekaKataWordsManager() {
  const token = useAdminToken();
  const toast = useToast();
  const [words, setWords] = useState<TekaKataWordDTO[]>([]);
  const [categories, setCategories] = useState<TekaKataCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Form inputs
  const [word, setWord] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [difficulty, setDifficulty] = useState<TekaKataDifficulty>("easy");
  const [saving, setSaving] = useState(false);

  // Filter inputs
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterDiff, setFilterDiff] = useState("");

  const refresh = useCallback(async () => {
    try {
      const query: Record<string, string> = {};
      if (search.trim()) query.search = search.trim();
      if (filterCat) query.categoryId = filterCat;
      if (filterDiff) query.difficulty = filterDiff;

      const data = await tekaKataApi.words.list(token, query);
      setWords(data);
    } catch (err) {
      toast(errorMessage(err, "Gagal memuat daftar kata Susun Kata."), "error");
    } finally {
      setLoading(false);
    }
  }, [token, toast, search, filterCat, filterDiff]);

  useEffect(() => {
    void refresh();
    tekaKataApi.categories
      .list(token)
      .then((cats) => {
        setCategories(cats);
        if (cats[0]) setCategoryId((current) => current || cats[0].id);
      })
      .catch((err) => toast(errorMessage(err, "Gagal memuat kategori Susun Kata."), "error"));
  }, [refresh, token, toast]);

  const add = async () => {
    if (!word.trim() || !categoryId) return;
    setSaving(true);
    try {
      await tekaKataApi.words.create(token, {
        word: word.trim(),
        categoryId,
        difficulty,
      });
      setWord("");
      toast("Kata Susun Kata berhasil ditambahkan.", "success");
      await refresh();
    } catch (err) {
      toast(errorMessage(err, "Gagal menambah kata."), "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item: TekaKataWordDTO) => {
    try {
      await tekaKataApi.words.update(token, item.id, { isActive: !item.isActive });
      toast(`“${item.word}” ${item.isActive ? "dinonaktifkan" : "diaktifkan"}.`, "success");
      await refresh();
    } catch (err) {
      toast(errorMessage(err, "Gagal mengubah status kata."), "error");
    }
  };

  const remove = async (item: TekaKataWordDTO) => {
    if (!confirm(`Hapus kata "${item.word}"?`)) return;
    try {
      await tekaKataApi.words.remove(token, item.id);
      toast(`“${item.word}” dihapus.`, "success");
      await refresh();
    } catch (err) {
      toast(errorMessage(err, "Gagal menghapus kata."), "error");
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <AdminPageHeader
        title="Word Bank — Susun Kata"
        description="Daftar kata untuk generator crossword Susun Kata LIVE. Kata nonaktif tidak akan dimasukkan ke puzzle."
        count={words.length}
      />

      {/* Add word form */}
      <Card>
        <CardTitle>Tambah Kata Baru</CardTitle>
        <form
          className="flex flex-wrap items-end gap-3 pt-2"
          onSubmit={(e) => {
            e.preventDefault();
            void add();
          }}
        >
          <label className="min-w-[180px] flex-1">
            <span className="nb-label mb-1.5 block">Kata Target</span>
            <input
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="BANDAR"
              className="nb-input uppercase"
              minLength={3}
              maxLength={12}
            />
          </label>
          <label className="min-w-[160px]">
            <span className="nb-label mb-1.5 block">Kategori</span>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="nb-input"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="min-w-[130px]">
            <span className="nb-label mb-1.5 block">Difficulty</span>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as TekaKataDifficulty)}
              className="nb-input"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d.toUpperCase()}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" disabled={saving || !word.trim() || !categoryId}>
            + Tambah Kata
          </Button>
        </form>
      </Card>

      {/* Filter bar */}
      <Card padded={false} className="p-4 bg-paper-deep">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Cari kata..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="nb-input text-xs"
            />
          </div>
          <div className="w-[160px]">
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="nb-input text-xs"
            >
              <option value="">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="w-[140px]">
            <select
              value={filterDiff}
              onChange={(e) => setFilterDiff(e.target.value)}
              className="nb-input text-xs"
            >
              <option value="">Semua Level</option>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          <Button size="sm" variant="secondary" onClick={() => void refresh()}>
            Filter
          </Button>
        </div>
      </Card>

      {/* Words table */}
      <Card padded={false} className="overflow-x-auto">
        {loading ? (
          <p className="p-5 text-sm font-medium text-muted">Memuat...</p>
        ) : words.length === 0 ? (
          <p className="p-5 text-sm font-medium text-muted">Belum ada kata Susun Kata yang cocok.</p>
        ) : (
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-ink text-xs uppercase tracking-wider text-yellow">
                <th className="px-4 py-3 font-bold">Kata</th>
                <th className="px-4 py-3 font-bold">Panjang</th>
                <th className="px-4 py-3 font-bold">Kategori</th>
                <th className="px-4 py-3 font-bold">Level</th>
                <th className="px-4 py-3 text-right font-bold">Dipakai</th>
                <th className="px-4 py-3 text-right font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {words.map((item, index) => (
                <tr
                  key={item.id}
                  className={`border-t-2 border-ink ${
                    index % 2 === 1 ? "bg-paper" : "bg-white"
                  } ${item.isActive ? "" : "text-muted opacity-60"}`}
                >
                  <td className="px-4 py-2.5">
                    <span className="font-display text-base uppercase tracking-wide">
                      {item.word}
                    </span>
                    {!item.isActive && (
                      <span className="ml-2 rounded-full border-2 border-ink bg-white px-2 text-[10px] font-bold uppercase text-ink">
                        Nonaktif
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs font-bold">
                    {item.word.length} huruf
                  </td>
                  <td className="px-4 py-2.5 font-medium">{item.category?.name ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    <DifficultyBadge difficulty={item.difficulty} />
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold">{item.usageCount}</td>
                  <td className="px-4 py-2.5">
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

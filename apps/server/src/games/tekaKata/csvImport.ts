import { normalizeTekaKataWord, type TekaKataDifficulty } from "@tebak-kata/shared";
import { prisma } from "../../core/db.js";

export interface CsvRow {
  word: string;
  categoryName: string;
  categoryId: string;
  difficulty: TekaKataDifficulty;
}

export interface CsvParseResult {
  rows: CsvRow[];
  errors: { line: number; raw: string; error: string }[];
}

const DIFFICULTIES: readonly TekaKataDifficulty[] = ["easy", "medium", "hard", "boss"];

/** Parses `word,category,difficulty` lines (header optional; `;` also accepted as separator). */
export async function parseTekaKataCsv(csvContent: string): Promise<CsvParseResult> {
  const lines = csvContent
    .replace(/^﻿/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const startIndex = lines[0]?.toLowerCase().includes("word") || lines[0]?.toLowerCase().includes("kata") ? 1 : 0;

  const categories = await prisma.tekaKataCategory.findMany();
  const byName = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));
  const fallbackCategory = byName.get("umum") ?? categories[0]?.id;

  const rows: CsvRow[] = [];
  const errors: CsvParseResult["errors"] = [];
  const seen = new Set<string>();

  for (let i = startIndex; i < lines.length; i++) {
    const raw = lines[i];
    const parts = raw.split(/[,;]/).map((p) => p.trim().replace(/^"|"$/g, ""));
    const word = normalizeTekaKataWord(parts[0] ?? "");
    if (word.length < 3 || word.length > 12) {
      errors.push({ line: i + 1, raw, error: "Panjang kata harus 3–12 huruf." });
      continue;
    }
    if (!/^[A-Z]+$/.test(word)) {
      errors.push({ line: i + 1, raw, error: "Kata hanya boleh berisi huruf A–Z." });
      continue;
    }
    const categoryName = parts[1] || "Umum";
    const categoryId = byName.get(categoryName.toLowerCase()) ?? fallbackCategory;
    if (!categoryId) {
      errors.push({ line: i + 1, raw, error: `Kategori "${categoryName}" tidak ada.` });
      continue;
    }
    const rawDiff = (parts[2] ?? "").toLowerCase() as TekaKataDifficulty;
    const difficulty = DIFFICULTIES.includes(rawDiff) ? rawDiff : "easy";
    const key = `${word}:${categoryId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({ word, categoryName, categoryId, difficulty });
  }
  return { rows, errors };
}

export async function importTekaKataRows(rows: CsvRow[]): Promise<number> {
  let imported = 0;
  for (const row of rows) {
    await prisma.tekaKataWord.upsert({
      where: { word_categoryId: { word: row.word, categoryId: row.categoryId } },
      create: {
        word: row.word,
        normalizedWord: row.word,
        categoryId: row.categoryId,
        difficulty: row.difficulty,
        minimumLength: row.word.length,
        maximumLength: row.word.length,
        isAllowed: true,
        isActive: true,
      },
      update: { difficulty: row.difficulty, isActive: true },
    });
    imported++;
  }
  return imported;
}

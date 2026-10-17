import { normalizeGuess } from "@tebak-kata/shared";
import { prisma } from "../../core/db.js";

const CATEGORY_EMOJI: Record<string, string> = {
  Umum: "🌐",
  Hewan: "🐾",
  Buah: "🍎",
  Makanan: "🍜",
  Profesi: "💼",
  Benda: "📦",
  Tempat: "📍",
  Transportasi: "🚗",
  Teknologi: "💻",
  Alam: "🌿",
  Olahraga: "⚽",
  Pendidikan: "🎓",
  Musik: "🎵",
  Negara: "🗺️",
};

/**
 * Copies every Susun Kata word into the Tebak Kata bank (same category name,
 * created when missing). Existing words keep their usage count. Returns how
 * many words were copied or updated.
 */
export async function copyTekaKataWordsToTebakKata(): Promise<number> {
  const tekaWords = await prisma.tekaKataWord.findMany({ include: { category: true } });
  const categoryIds = new Map<string, string>();
  let copied = 0;

  for (const tkWord of tekaWords) {
    const catName = tkWord.category?.name ?? "Umum";
    let categoryId = categoryIds.get(catName);
    if (!categoryId) {
      const category = await prisma.category.upsert({
        where: { name: catName },
        create: { name: catName, emoji: CATEGORY_EMOJI[catName] ?? "🏷️" },
        update: {},
      });
      categoryId = category.id;
      categoryIds.set(catName, categoryId);
    }

    const word = normalizeGuess(tkWord.word);
    if (word.length < 2) continue;
    try {
      await prisma.word.upsert({
        where: { word_categoryId: { word, categoryId } },
        create: { word, categoryId, difficulty: tkWord.difficulty, isActive: tkWord.isActive },
        update: { difficulty: tkWord.difficulty, isActive: tkWord.isActive },
      });
      copied++;
    } catch (err) {
      console.error(`[tebakKata] failed to copy word ${word}:`, err);
    }
  }
  return copied;
}

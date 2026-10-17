import { PrismaClient } from "@prisma/client";
import {
  CATEGORY_SEED,
  TEKA_KATA_CATEGORIES_SEED,
  normalizeGuess,
  normalizeTekaKataWord,
} from "@tebak-kata/shared";

const prisma = new PrismaClient();

const WORDS: Array<{ word: string; category: string; difficulty: "easy" | "medium" | "hard" | "boss" }> = [
  // Easy — PRD section 16 examples
  { word: "RUMAH", category: "Tempat", difficulty: "easy" },
  { word: "KELAS", category: "Pendidikan", difficulty: "easy" },
  { word: "MEJA", category: "Benda", difficulty: "easy" },
  { word: "BUKU", category: "Pendidikan", difficulty: "easy" },
  { word: "KUCING", category: "Hewan", difficulty: "easy" },
  { word: "AYAM", category: "Hewan", difficulty: "easy" },
  { word: "NASI", category: "Makanan", difficulty: "easy" },
  { word: "BOLA", category: "Olahraga", difficulty: "easy" },
  { word: "MOBIL", category: "Kendaraan", difficulty: "easy" },
  { word: "GITAR", category: "Musik", difficulty: "easy" },

  // Medium — PRD section 16 examples
  { word: "KOMPUTER", category: "Teknologi", difficulty: "medium" },
  { word: "KENDARAAN", category: "Kendaraan", difficulty: "medium" },
  { word: "PELANGI", category: "Alam", difficulty: "medium" },
  { word: "SEPAKBOLA", category: "Olahraga", difficulty: "medium" },
  { word: "INDONESIA", category: "Negara", difficulty: "medium" },
  { word: "DOKTER", category: "Profesi", difficulty: "medium" },
  { word: "RESTORAN", category: "Tempat", difficulty: "medium" },
  { word: "SMARTPHONE", category: "Teknologi", difficulty: "medium" },

  // Hard — PRD section 16 examples
  { word: "ENTREPRENEUR", category: "Profesi", difficulty: "hard" },
  { word: "KONSTRUKSI", category: "Benda", difficulty: "hard" },
  { word: "PERPUSTAKAAN", category: "Pendidikan", difficulty: "hard" },
  { word: "FOTOSINTESIS", category: "Alam", difficulty: "hard" },
  { word: "KESEHATAN", category: "Umum", difficulty: "hard" },
  { word: "TEKNOLOGI", category: "Teknologi", difficulty: "hard" },

  // Boss — longer / spectacular, PRD section 20
  { word: "TELEKOMUNIKASI", category: "Teknologi", difficulty: "boss" },
  { word: "TRANSPORTASI", category: "Kendaraan", difficulty: "boss" },
  { word: "KEMERDEKAAN", category: "Umum", difficulty: "boss" },
  { word: "UNIVERSITAS", category: "Pendidikan", difficulty: "boss" },
  { word: "KEANEKARAGAMAN", category: "Alam", difficulty: "boss" },
];

const TEKA_KATA_WORDS: Array<{
  word: string;
  category: string;
  difficulty: "easy" | "medium" | "hard" | "boss";
}> = [
  // Umum - Easy (Cluster BANDAR)
  { word: "BANDAR", category: "Umum", difficulty: "easy" },
  { word: "BADAN", category: "Umum", difficulty: "easy" },
  { word: "DANA", category: "Umum", difficulty: "easy" },
  { word: "DARA", category: "Umum", difficulty: "easy" },
  { word: "NADA", category: "Umum", difficulty: "easy" },
  { word: "RADA", category: "Umum", difficulty: "easy" },
  { word: "RABA", category: "Umum", difficulty: "easy" },
  { word: "ARAN", category: "Umum", difficulty: "easy" },
  { word: "ABAN", category: "Umum", difficulty: "easy" },

  // Umum - Easy (Cluster PASAR)
  { word: "PASAR", category: "Umum", difficulty: "easy" },
  { word: "PARAS", category: "Umum", difficulty: "easy" },
  { word: "SAPAR", category: "Umum", difficulty: "easy" },
  { word: "RASA", category: "Umum", difficulty: "easy" },
  { word: "ASAP", category: "Umum", difficulty: "easy" },
  { word: "SAPA", category: "Umum", difficulty: "easy" },
  { word: "PARA", category: "Umum", difficulty: "easy" },

  // Makanan - Easy (Cluster MAKAN)
  { word: "MAKAN", category: "Makanan", difficulty: "easy" },
  { word: "MANA", category: "Makanan", difficulty: "easy" },
  { word: "AKAN", category: "Makanan", difficulty: "easy" },
  { word: "ANAK", category: "Makanan", difficulty: "easy" },
  { word: "KAMA", category: "Makanan", difficulty: "easy" },
  { word: "NAMA", category: "Makanan", difficulty: "easy" },

  // Hewan - Easy (Cluster KANCIL)
  { word: "KANCIL", category: "Hewan", difficulty: "easy" },
  { word: "CINA", category: "Hewan", difficulty: "easy" },
  { word: "IKAN", category: "Hewan", difficulty: "easy" },
  { word: "KAIN", category: "Hewan", difficulty: "easy" },
  { word: "NAIK", category: "Hewan", difficulty: "easy" },
  { word: "LACI", category: "Hewan", difficulty: "easy" },
  { word: "ALIK", category: "Hewan", difficulty: "easy" },

  // Buah - Easy (Cluster MANGGA)
  { word: "MANGGA", category: "Buah", difficulty: "easy" },
  { word: "GAMA", category: "Buah", difficulty: "easy" },
  { word: "MAGA", category: "Buah", difficulty: "easy" },
  { word: "AGAM", category: "Buah", difficulty: "easy" },
  { word: "GANG", category: "Buah", difficulty: "easy" },

  // Teknologi - Medium (Cluster KOMPUTER)
  { word: "KOMPUTER", category: "Teknologi", difficulty: "medium" },
  { word: "TEMPO", category: "Teknologi", difficulty: "medium" },
  { word: "KOTOR", category: "Teknologi", difficulty: "medium" },
  { word: "POTRET", category: "Teknologi", difficulty: "medium" },
  { word: "ROKET", category: "Teknologi", difficulty: "medium" },
  { word: "METRO", category: "Teknologi", difficulty: "medium" },
  { word: "PERUT", category: "Teknologi", difficulty: "medium" },
  { word: "TEPUK", category: "Teknologi", difficulty: "medium" },
  { word: "KUTUB", category: "Teknologi", difficulty: "medium" },
  { word: "KOMPOR", category: "Teknologi", difficulty: "medium" },

  // Transportasi - Medium (Cluster KENDARAAN)
  { word: "KENDARAAN", category: "Transportasi", difficulty: "medium" },
  { word: "RADEN", category: "Transportasi", difficulty: "medium" },
  { word: "DENDA", category: "Transportasi", difficulty: "medium" },
  { word: "KEDAN", category: "Transportasi", difficulty: "medium" },
  { word: "REKAN", category: "Transportasi", difficulty: "medium" },
  { word: "ANEKA", category: "Transportasi", difficulty: "medium" },
  { word: "KADAR", category: "Transportasi", difficulty: "medium" },
  { word: "DANAU", category: "Transportasi", difficulty: "medium" },
  { word: "DEKAN", category: "Transportasi", difficulty: "medium" },

  // Profesi - Hard (Cluster KONSULTAN)
  { word: "KONSULTAN", category: "Profesi", difficulty: "hard" },
  { word: "SANTUN", category: "Profesi", difficulty: "hard" },
  { word: "TUKANG", category: "Profesi", difficulty: "hard" },
  { word: "LONTAR", category: "Profesi", difficulty: "hard" },
  { word: "KOLONEL", category: "Profesi", difficulty: "hard" },
  { word: "KANTOR", category: "Profesi", difficulty: "hard" },
  { word: "SOLUSI", category: "Profesi", difficulty: "hard" },
  { word: "TULANG", category: "Profesi", difficulty: "hard" },
  { word: "KASTA", category: "Profesi", difficulty: "hard" },
  { word: "NOTULA", category: "Profesi", difficulty: "hard" },

  // Boss - (Cluster TELEKOMUNIKASI)
  { word: "TELEKOMUNIKASI", category: "Teknologi", difficulty: "boss" },
  { word: "KOMUNIKASI", category: "Teknologi", difficulty: "boss" },
  { word: "MELUKIS", category: "Teknologi", difficulty: "boss" },
  { word: "SELALU", category: "Teknologi", difficulty: "boss" },
  { word: "LELAKI", category: "Teknologi", difficulty: "boss" },
  { word: "KUSUMA", category: "Teknologi", difficulty: "boss" },
  { word: "KEMULIAAN", category: "Teknologi", difficulty: "boss" },
  { word: "SENTOSA", category: "Teknologi", difficulty: "boss" },
  { word: "SIMULASI", category: "Teknologi", difficulty: "boss" },
  { word: "LELANG", category: "Teknologi", difficulty: "boss" },
];

const GIFTS = [
  // TikTok numeric gift ids (matching also falls back to the gift name).
  { giftId: "5655", giftName: "Rose", effect: "REVEAL_NEXT_LETTER" as const, enabled: true },
  { giftId: "11046", giftName: "Galaxy", effect: "REVEAL_NEXT_LETTER" as const, enabled: true },
  { giftId: "5658", giftName: "Perfume", effect: "REVEAL_NEXT_LETTER" as const, enabled: true },
];

async function main() {
  // 1. Tebak Kata categories & words
  const categoryByName = new Map<string, string>();
  for (const c of CATEGORY_SEED) {
    const row = await prisma.category.upsert({
      where: { name: c.name },
      create: { name: c.name, emoji: c.emoji },
      update: { emoji: c.emoji },
    });
    categoryByName.set(c.name, row.id);
  }

  for (const w of WORDS) {
    const categoryId = categoryByName.get(w.category);
    if (!categoryId) throw new Error(`Seed error: unknown category "${w.category}"`);
    const word = normalizeGuess(w.word);
    await prisma.word.upsert({
      where: { word_categoryId: { word, categoryId } },
      create: { word, categoryId, difficulty: w.difficulty, isActive: true },
      update: { difficulty: w.difficulty, isActive: true },
    });
  }

  for (const g of GIFTS) {
    await prisma.giftConfig.upsert({
      where: { giftId: g.giftId },
      create: g,
      update: g,
    });
  }

  // 2. Teka Kata categories & words
  const tkCategoryByName = new Map<string, string>();
  for (const c of TEKA_KATA_CATEGORIES_SEED) {
    const row = await prisma.tekaKataCategory.upsert({
      where: { name: c.name },
      create: { name: c.name, description: c.description, isActive: true },
      update: { description: c.description, isActive: true },
    });
    tkCategoryByName.set(c.name, row.id);
  }

  for (const w of TEKA_KATA_WORDS) {
    const categoryId = tkCategoryByName.get(w.category) || tkCategoryByName.get("Umum");
    if (!categoryId) continue;
    const normalized = normalizeTekaKataWord(w.word);
    await prisma.tekaKataWord.upsert({
      where: { word_categoryId: { word: normalized, categoryId } },
      create: {
        word: normalized,
        normalizedWord: normalized,
        categoryId,
        difficulty: w.difficulty,
        minimumLength: normalized.length,
        maximumLength: normalized.length,
        isAllowed: true,
        isActive: true,
      },
      update: { difficulty: w.difficulty, isActive: true },
    });
  }

  console.log(
    `Seeded ${categoryByName.size} Tebak Kata categories, ${WORDS.length} words; ${tkCategoryByName.size} Teka Kata categories, ${TEKA_KATA_WORDS.length} words; ${GIFTS.length} gift configs.`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

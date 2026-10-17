/** CLI: copy the Susun Kata word bank into Tebak Kata (`npx tsx src/scripts/copyTekaKataToTebakKata.ts`). */
import { prisma } from "../core/db.js";
import { copyTekaKataWordsToTebakKata } from "../games/tebakKata/syncWords.js";

copyTekaKataWordsToTebakKata()
  .then(async (copied) => {
    const total = await prisma.word.count();
    console.log(`Selesai: ${copied} kata disalin/diperbarui. Total kata Tebak Kata: ${total}`);
  })
  .catch((err: unknown) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

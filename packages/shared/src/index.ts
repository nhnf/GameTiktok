/**
 * @tebak-kata/shared — domain types, realtime event contract and pure game
 * rules shared by apps/server and apps/web. Organised as one module per game:
 *
 *   core/               session types, events, design tokens, gift utilities
 *   games/tebakKata/    Tebak Kata
 *   games/tekaKata/     Susun Kata (crossword)
 *   games/matematika/   Matematika LIVE (hitung cepat)
 *   games/mathBattle/   Tarik Tambang (team math battle)
 *   games/autoBattle/   Auto Battle Arena (gift battle)
 */
export * from "./core/index.js";
export * from "./games/tebakKata/index.js";
export * from "./games/tekaKata/index.js";
export * from "./games/matematika/index.js";
export * from "./games/mathBattle/index.js";
export * from "./games/autoBattle/index.js";

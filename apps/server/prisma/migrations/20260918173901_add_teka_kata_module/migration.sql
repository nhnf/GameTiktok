-- CreateTable
CREATE TABLE "teka_kata_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "teka_kata_words" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "word" TEXT NOT NULL,
    "normalizedWord" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "minimumLength" INTEGER NOT NULL DEFAULT 3,
    "maximumLength" INTEGER NOT NULL DEFAULT 12,
    "isAllowed" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "teka_kata_words_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "teka_kata_categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "teka_kata_puzzles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "categoryId" TEXT,
    "lettersJson" TEXT NOT NULL,
    "gridRows" INTEGER NOT NULL,
    "gridColumns" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "totalWords" INTEGER NOT NULL,
    "foundWords" INTEGER NOT NULL DEFAULT 0,
    "isBoss" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    CONSTRAINT "teka_kata_puzzles_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "live_sessions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "teka_kata_puzzles_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "teka_kata_categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "teka_kata_puzzle_words" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "puzzleId" TEXT NOT NULL,
    "wordId" TEXT,
    "word" TEXT NOT NULL,
    "row" INTEGER NOT NULL,
    "column" INTEGER NOT NULL,
    "direction" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "isFound" BOOLEAN NOT NULL DEFAULT false,
    "isRevealed" BOOLEAN NOT NULL DEFAULT false,
    "foundByPlayerId" TEXT,
    "foundAt" DATETIME,
    CONSTRAINT "teka_kata_puzzle_words_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "teka_kata_puzzles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "teka_kata_puzzle_words_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "teka_kata_words" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "teka_kata_puzzle_words_foundByPlayerId_fkey" FOREIGN KEY ("foundByPlayerId") REFERENCES "session_players" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "teka_kata_found_words" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "puzzleId" TEXT NOT NULL,
    "puzzleWordId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "rawComment" TEXT,
    "points" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "teka_kata_found_words_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "teka_kata_puzzles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "teka_kata_found_words_puzzleWordId_fkey" FOREIGN KEY ("puzzleWordId") REFERENCES "teka_kata_puzzle_words" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "teka_kata_found_words_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "session_players" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_live_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL,
    "activeGame" TEXT NOT NULL DEFAULT 'TEBAK_KATA',
    "settingsJson" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME
);
INSERT INTO "new_live_sessions" ("endedAt", "id", "settingsJson", "startedAt", "status") SELECT "endedAt", "id", "settingsJson", "startedAt", "status" FROM "live_sessions";
DROP TABLE "live_sessions";
ALTER TABLE "new_live_sessions" RENAME TO "live_sessions";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "teka_kata_categories_name_key" ON "teka_kata_categories"("name");

-- CreateIndex
CREATE INDEX "teka_kata_words_difficulty_isActive_idx" ON "teka_kata_words"("difficulty", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "teka_kata_words_word_categoryId_key" ON "teka_kata_words"("word", "categoryId");

-- CreateIndex
CREATE INDEX "teka_kata_puzzles_sessionId_status_idx" ON "teka_kata_puzzles"("sessionId", "status");

-- CreateIndex
CREATE INDEX "teka_kata_puzzle_words_puzzleId_isFound_idx" ON "teka_kata_puzzle_words"("puzzleId", "isFound");

-- CreateIndex
CREATE INDEX "teka_kata_found_words_puzzleId_idx" ON "teka_kata_found_words"("puzzleId");

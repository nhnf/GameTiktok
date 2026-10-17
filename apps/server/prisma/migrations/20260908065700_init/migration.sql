-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "words" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "word" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "words_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "live_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL,
    "settingsJson" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME
);

-- CreateTable
CREATE TABLE "session_players" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "platformUserId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "guesses" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "session_players_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "live_sessions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "puzzles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "isBoss" BOOLEAN NOT NULL DEFAULT false,
    "displayState" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "winnerPlayerId" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "solvedAt" DATETIME,
    CONSTRAINT "puzzles_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "live_sessions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "puzzles_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "words" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "puzzles_winnerPlayerId_fkey" FOREIGN KEY ("winnerPlayerId") REFERENCES "session_players" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "puzzle_guesses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "puzzleId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "rawComment" TEXT NOT NULL,
    "normalizedGuess" TEXT NOT NULL,
    "matchedLength" INTEGER NOT NULL,
    "isFullMatch" BOOLEAN NOT NULL,
    "isWinner" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "puzzle_guesses_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "puzzles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "puzzle_guesses_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "session_players" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "gift_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "giftId" TEXT NOT NULL,
    "giftName" TEXT NOT NULL,
    "effect" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "game_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payloadJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "game_events_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "live_sessions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE INDEX "words_difficulty_isActive_idx" ON "words"("difficulty", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "words_word_categoryId_key" ON "words"("word", "categoryId");

-- CreateIndex
CREATE INDEX "session_players_sessionId_points_idx" ON "session_players"("sessionId", "points");

-- CreateIndex
CREATE UNIQUE INDEX "session_players_sessionId_platformUserId_key" ON "session_players"("sessionId", "platformUserId");

-- CreateIndex
CREATE INDEX "puzzles_sessionId_status_idx" ON "puzzles"("sessionId", "status");

-- CreateIndex
CREATE INDEX "puzzle_guesses_puzzleId_idx" ON "puzzle_guesses"("puzzleId");

-- CreateIndex
CREATE UNIQUE INDEX "gift_configs_giftId_key" ON "gift_configs"("giftId");

-- CreateIndex
CREATE INDEX "game_events_sessionId_type_idx" ON "game_events"("sessionId", "type");

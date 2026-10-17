-- Brings migration history in line with schema.prisma. Matematika and
-- Tarik Tambang tables were first created with `prisma db push` and never got
-- a migration, and several foreign keys gained ON DELETE rules the same way,
-- so fresh installs ended up with a different database than existing ones.
-- IF NOT EXISTS keeps this safe on databases that already have the tables;
-- the table redefinitions only rebuild tables with the rules schema.prisma
-- declares (data is copied over). Also adds app_settings (persisted settings).

-- CreateTable
CREATE TABLE IF NOT EXISTS "math_questions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "expression" TEXT NOT NULL,
    "number1" INTEGER NOT NULL,
    "number2" INTEGER NOT NULL,
    "number3" INTEGER NOT NULL,
    "operator1" TEXT NOT NULL,
    "operator2" TEXT NOT NULL,
    "answer" INTEGER NOT NULL,
    "minNumber" INTEGER NOT NULL DEFAULT 1,
    "maxNumber" INTEGER NOT NULL DEFAULT 99,
    "allowNegative" BOOLEAN NOT NULL DEFAULT false,
    "durationSeconds" INTEGER NOT NULL DEFAULT 10,
    "status" TEXT NOT NULL,
    "startedAt" DATETIME,
    "endsAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "math_questions_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "live_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "math_answers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "questionId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "submittedAnswer" INTEGER NOT NULL,
    "rawComment" TEXT,
    "isCorrect" BOOLEAN NOT NULL,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "math_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "math_questions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "math_answers_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "session_players" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "app_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "valueJson" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "math_battle_gift_mappings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "giftId" TEXT,
    "giftName" TEXT NOT NULL,
    "team" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "power" INTEGER NOT NULL DEFAULT 5,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "diamondCount" INTEGER,
    "imageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "math_battle_settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "configJson" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "math_battle_matches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT,
    "matchNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "winner" TEXT,
    "winningReason" TEXT,
    "totalRounds" INTEGER NOT NULL,
    "completedRounds" INTEGER NOT NULL,
    "finalRopePosition" INTEGER NOT NULL,
    "blueTotalPower" INTEGER NOT NULL DEFAULT 0,
    "redTotalPower" INTEGER NOT NULL DEFAULT 0,
    "blueAnswerPower" INTEGER NOT NULL DEFAULT 0,
    "redAnswerPower" INTEGER NOT NULL DEFAULT 0,
    "blueGiftPower" INTEGER NOT NULL DEFAULT 0,
    "redGiftPower" INTEGER NOT NULL DEFAULT 0,
    "blueRoundsWon" INTEGER NOT NULL DEFAULT 0,
    "redRoundsWon" INTEGER NOT NULL DEFAULT 0,
    "resultJson" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "math_battle_rounds" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "blueQuestion" TEXT NOT NULL,
    "blueAnswer" INTEGER NOT NULL,
    "redQuestion" TEXT NOT NULL,
    "redAnswer" INTEGER NOT NULL,
    "blueAnswerPower" INTEGER NOT NULL,
    "redAnswerPower" INTEGER NOT NULL,
    "blueGiftPower" INTEGER NOT NULL,
    "redGiftPower" INTEGER NOT NULL,
    "blueTotalPower" INTEGER NOT NULL,
    "redTotalPower" INTEGER NOT NULL,
    "ropePositionBefore" INTEGER NOT NULL,
    "ropePositionAfter" INTEGER NOT NULL,
    "roundWinner" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "math_battle_rounds_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "math_battle_matches" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "math_battle_gift_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "eventId" TEXT NOT NULL,
    "viewerId" TEXT NOT NULL,
    "viewerName" TEXT NOT NULL,
    "giftId" TEXT NOT NULL,
    "giftName" TEXT NOT NULL,
    "team" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "power" INTEGER NOT NULL,
    "giftCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "math_battle_gift_events_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "math_battle_matches" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_game_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payloadJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "game_events_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "live_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_game_events" ("createdAt", "id", "payloadJson", "sessionId", "type") SELECT "createdAt", "id", "payloadJson", "sessionId", "type" FROM "game_events";
DROP TABLE "game_events";
ALTER TABLE "new_game_events" RENAME TO "game_events";
CREATE INDEX "game_events_sessionId_type_idx" ON "game_events"("sessionId", "type");
CREATE TABLE "new_puzzle_guesses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "puzzleId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "rawComment" TEXT NOT NULL,
    "normalizedGuess" TEXT NOT NULL,
    "matchedLength" INTEGER NOT NULL,
    "isFullMatch" BOOLEAN NOT NULL,
    "isWinner" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "puzzle_guesses_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "puzzles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "puzzle_guesses_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "session_players" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_puzzle_guesses" ("createdAt", "id", "isFullMatch", "isWinner", "matchedLength", "normalizedGuess", "playerId", "puzzleId", "rawComment") SELECT "createdAt", "id", "isFullMatch", "isWinner", "matchedLength", "normalizedGuess", "playerId", "puzzleId", "rawComment" FROM "puzzle_guesses";
DROP TABLE "puzzle_guesses";
ALTER TABLE "new_puzzle_guesses" RENAME TO "puzzle_guesses";
CREATE INDEX "puzzle_guesses_puzzleId_idx" ON "puzzle_guesses"("puzzleId");
CREATE TABLE "new_puzzles" (
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
    CONSTRAINT "puzzles_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "live_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "puzzles_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "words" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "puzzles_winnerPlayerId_fkey" FOREIGN KEY ("winnerPlayerId") REFERENCES "session_players" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_puzzles" ("difficulty", "displayState", "id", "isBoss", "sessionId", "solvedAt", "startedAt", "status", "winnerPlayerId", "wordId") SELECT "difficulty", "displayState", "id", "isBoss", "sessionId", "solvedAt", "startedAt", "status", "winnerPlayerId", "wordId" FROM "puzzles";
DROP TABLE "puzzles";
ALTER TABLE "new_puzzles" RENAME TO "puzzles";
CREATE INDEX "puzzles_sessionId_status_idx" ON "puzzles"("sessionId", "status");
CREATE TABLE "new_session_players" (
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
    CONSTRAINT "session_players_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "live_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_session_players" ("avatarUrl", "createdAt", "displayName", "guesses", "id", "platformUserId", "points", "sessionId", "updatedAt", "username", "wins") SELECT "avatarUrl", "createdAt", "displayName", "guesses", "id", "platformUserId", "points", "sessionId", "updatedAt", "username", "wins" FROM "session_players";
DROP TABLE "session_players";
ALTER TABLE "new_session_players" RENAME TO "session_players";
CREATE INDEX "session_players_sessionId_points_idx" ON "session_players"("sessionId", "points");
CREATE UNIQUE INDEX "session_players_sessionId_platformUserId_key" ON "session_players"("sessionId", "platformUserId");
CREATE TABLE "new_teka_kata_found_words" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "puzzleId" TEXT NOT NULL,
    "puzzleWordId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "rawComment" TEXT,
    "points" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "teka_kata_found_words_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "teka_kata_puzzles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "teka_kata_found_words_puzzleWordId_fkey" FOREIGN KEY ("puzzleWordId") REFERENCES "teka_kata_puzzle_words" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "teka_kata_found_words_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "session_players" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_teka_kata_found_words" ("createdAt", "id", "playerId", "points", "puzzleId", "puzzleWordId", "rawComment") SELECT "createdAt", "id", "playerId", "points", "puzzleId", "puzzleWordId", "rawComment" FROM "teka_kata_found_words";
DROP TABLE "teka_kata_found_words";
ALTER TABLE "new_teka_kata_found_words" RENAME TO "teka_kata_found_words";
CREATE INDEX "teka_kata_found_words_puzzleId_idx" ON "teka_kata_found_words"("puzzleId");
CREATE TABLE "new_teka_kata_puzzles" (
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
    CONSTRAINT "teka_kata_puzzles_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "live_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "teka_kata_puzzles_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "teka_kata_categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_teka_kata_puzzles" ("categoryId", "completedAt", "createdAt", "difficulty", "foundWords", "gridColumns", "gridRows", "id", "isBoss", "lettersJson", "sessionId", "startedAt", "status", "totalWords") SELECT "categoryId", "completedAt", "createdAt", "difficulty", "foundWords", "gridColumns", "gridRows", "id", "isBoss", "lettersJson", "sessionId", "startedAt", "status", "totalWords" FROM "teka_kata_puzzles";
DROP TABLE "teka_kata_puzzles";
ALTER TABLE "new_teka_kata_puzzles" RENAME TO "teka_kata_puzzles";
CREATE INDEX "teka_kata_puzzles_sessionId_status_idx" ON "teka_kata_puzzles"("sessionId", "status");
CREATE TABLE "new_teka_kata_words" (
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
    CONSTRAINT "teka_kata_words_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "teka_kata_categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_teka_kata_words" ("categoryId", "createdAt", "difficulty", "id", "isActive", "isAllowed", "maximumLength", "minimumLength", "normalizedWord", "updatedAt", "usageCount", "word") SELECT "categoryId", "createdAt", "difficulty", "id", "isActive", "isAllowed", "maximumLength", "minimumLength", "normalizedWord", "updatedAt", "usageCount", "word" FROM "teka_kata_words";
DROP TABLE "teka_kata_words";
ALTER TABLE "new_teka_kata_words" RENAME TO "teka_kata_words";
CREATE INDEX "teka_kata_words_difficulty_isActive_idx" ON "teka_kata_words"("difficulty", "isActive");
CREATE UNIQUE INDEX "teka_kata_words_word_categoryId_key" ON "teka_kata_words"("word", "categoryId");
CREATE TABLE "new_words" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "word" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "words_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_words" ("categoryId", "createdAt", "difficulty", "id", "isActive", "updatedAt", "usageCount", "word") SELECT "categoryId", "createdAt", "difficulty", "id", "isActive", "updatedAt", "usageCount", "word" FROM "words";
DROP TABLE "words";
ALTER TABLE "new_words" RENAME TO "words";
CREATE INDEX "words_difficulty_isActive_idx" ON "words"("difficulty", "isActive");
CREATE UNIQUE INDEX "words_word_categoryId_key" ON "words"("word", "categoryId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "math_questions_sessionId_status_idx" ON "math_questions"("sessionId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "math_answers_questionId_isCorrect_idx" ON "math_answers"("questionId", "isCorrect");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "math_battle_gift_mappings_giftId_key" ON "math_battle_gift_mappings"("giftId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "math_battle_matches_startedAt_idx" ON "math_battle_matches"("startedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "math_battle_rounds_matchId_roundNumber_idx" ON "math_battle_rounds"("matchId", "roundNumber");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "math_battle_gift_events_eventId_key" ON "math_battle_gift_events"("eventId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "math_battle_gift_events_matchId_idx" ON "math_battle_gift_events"("matchId");


-- CreateTable
CREATE TABLE "seen_gifts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "giftId" TEXT NOT NULL,
    "giftName" TEXT NOT NULL,
    "diamondCount" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "timesSeen" INTEGER NOT NULL DEFAULT 0,
    "lastSender" TEXT,
    "firstSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "battle_gift_mappings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "giftId" TEXT,
    "giftName" TEXT NOT NULL,
    "team" TEXT NOT NULL,
    "unitType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "diamondCount" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "battle_settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "configJson" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "battle_matches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT,
    "matchNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "winner" TEXT,
    "reason" TEXT,
    "teamAName" TEXT NOT NULL,
    "teamBName" TEXT NOT NULL,
    "teamABaseHp" INTEGER,
    "teamBBaseHp" INTEGER,
    "duration" INTEGER,
    "totalGifts" INTEGER NOT NULL DEFAULT 0,
    "teamAGifts" INTEGER NOT NULL DEFAULT 0,
    "teamBGifts" INTEGER NOT NULL DEFAULT 0,
    "unitsSpawned" INTEGER NOT NULL DEFAULT 0,
    "resultJson" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME
);

-- CreateTable
CREATE TABLE "battle_gift_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "viewerId" TEXT NOT NULL,
    "viewerName" TEXT NOT NULL,
    "giftId" TEXT NOT NULL,
    "giftName" TEXT NOT NULL,
    "team" TEXT NOT NULL,
    "unitType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "giftCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "battle_gift_events_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "battle_matches" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "battle_contributions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchId" TEXT NOT NULL,
    "viewerId" TEXT NOT NULL,
    "viewerName" TEXT NOT NULL,
    "totalGifts" INTEGER NOT NULL,
    "unitsSpawned" INTEGER NOT NULL,
    "damage" INTEGER NOT NULL,
    "buildingDamage" INTEGER NOT NULL,
    "healing" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    CONSTRAINT "battle_contributions_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "battle_matches" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "seen_gifts_giftId_key" ON "seen_gifts"("giftId");

-- CreateIndex
CREATE UNIQUE INDEX "battle_gift_mappings_giftId_key" ON "battle_gift_mappings"("giftId");

-- CreateIndex
CREATE INDEX "battle_matches_startedAt_idx" ON "battle_matches"("startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "battle_gift_events_eventId_key" ON "battle_gift_events"("eventId");

-- CreateIndex
CREATE INDEX "battle_gift_events_matchId_idx" ON "battle_gift_events"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "battle_contributions_matchId_viewerId_key" ON "battle_contributions"("matchId", "viewerId");


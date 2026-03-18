-- v27: community ranking foundation (manual donations + current leaderboard snapshots)
DO $$
BEGIN
  CREATE TYPE "LeaderboardCategory" AS ENUM ('BEST_AUTHOR', 'BEST_TRANSLATOR', 'BEST_READER', 'BEST_USER', 'BEST_DONOR');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "LeaderboardPeriod" AS ENUM ('ALL_TIME');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "SpecialBadgeKey" AS ENUM ('PRIDE', 'ENVY', 'WRATH', 'SLOTH', 'GREED', 'GLUTTONY', 'LUST');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "DonationEntry" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdByAdminId" TEXT NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL,
  "currency" VARCHAR(8) NOT NULL DEFAULT 'IDR',
  "note" VARCHAR(500),
  "donatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DonationEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "LeaderboardSnapshot" (
  "id" TEXT NOT NULL,
  "category" "LeaderboardCategory" NOT NULL,
  "period" "LeaderboardPeriod" NOT NULL DEFAULT 'ALL_TIME',
  "userId" TEXT NOT NULL,
  "rank" INTEGER NOT NULL,
  "score" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "metadata" JSONB,
  "snapshotAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LeaderboardSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SpecialBadgeSnapshot" (
  "id" TEXT NOT NULL,
  "badgeKey" "SpecialBadgeKey" NOT NULL,
  "userId" TEXT NOT NULL,
  "score" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "metadata" JSONB,
  "snapshotAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SpecialBadgeSnapshot_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "DonationEntry"
  DROP CONSTRAINT IF EXISTS "DonationEntry_userId_fkey";
ALTER TABLE "DonationEntry"
  ADD CONSTRAINT "DonationEntry_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DonationEntry"
  DROP CONSTRAINT IF EXISTS "DonationEntry_createdByAdminId_fkey";
ALTER TABLE "DonationEntry"
  ADD CONSTRAINT "DonationEntry_createdByAdminId_fkey"
  FOREIGN KEY ("createdByAdminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "LeaderboardSnapshot"
  DROP CONSTRAINT IF EXISTS "LeaderboardSnapshot_userId_fkey";
ALTER TABLE "LeaderboardSnapshot"
  ADD CONSTRAINT "LeaderboardSnapshot_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SpecialBadgeSnapshot"
  DROP CONSTRAINT IF EXISTS "SpecialBadgeSnapshot_userId_fkey";
ALTER TABLE "SpecialBadgeSnapshot"
  ADD CONSTRAINT "SpecialBadgeSnapshot_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "DonationEntry_userId_donatedAt_idx"
  ON "DonationEntry"("userId", "donatedAt");
CREATE INDEX IF NOT EXISTS "DonationEntry_createdByAdminId_createdAt_idx"
  ON "DonationEntry"("createdByAdminId", "createdAt");
CREATE INDEX IF NOT EXISTS "DonationEntry_currency_donatedAt_idx"
  ON "DonationEntry"("currency", "donatedAt");

CREATE UNIQUE INDEX IF NOT EXISTS "LeaderboardSnapshot_category_period_userId_key"
  ON "LeaderboardSnapshot"("category", "period", "userId");
CREATE UNIQUE INDEX IF NOT EXISTS "LeaderboardSnapshot_category_period_rank_key"
  ON "LeaderboardSnapshot"("category", "period", "rank");
CREATE INDEX IF NOT EXISTS "LeaderboardSnapshot_userId_period_category_idx"
  ON "LeaderboardSnapshot"("userId", "period", "category");

CREATE UNIQUE INDEX IF NOT EXISTS "SpecialBadgeSnapshot_badgeKey_key"
  ON "SpecialBadgeSnapshot"("badgeKey");
CREATE INDEX IF NOT EXISTS "SpecialBadgeSnapshot_userId_idx"
  ON "SpecialBadgeSnapshot"("userId");

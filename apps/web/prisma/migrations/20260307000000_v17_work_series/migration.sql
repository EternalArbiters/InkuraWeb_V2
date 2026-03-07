-- v17: user-manageable work series

CREATE TABLE IF NOT EXISTS "Series" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "normalizedTitle" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Series_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Series_authorId_idx" ON "Series"("authorId");
CREATE UNIQUE INDEX IF NOT EXISTS "Series_authorId_normalizedTitle_key" ON "Series"("authorId", "normalizedTitle");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Series_authorId_fkey'
  ) THEN
    ALTER TABLE "Series"
      ADD CONSTRAINT "Series_authorId_fkey"
      FOREIGN KEY ("authorId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "Work" ADD COLUMN IF NOT EXISTS "seriesId" TEXT;
ALTER TABLE "Work" ADD COLUMN IF NOT EXISTS "seriesOrder" INTEGER;
CREATE INDEX IF NOT EXISTS "Work_seriesId_seriesOrder_idx" ON "Work"("seriesId", "seriesOrder");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Work_seriesId_fkey'
  ) THEN
    ALTER TABLE "Work"
      ADD CONSTRAINT "Work_seriesId_fkey"
      FOREIGN KEY ("seriesId") REFERENCES "Series"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

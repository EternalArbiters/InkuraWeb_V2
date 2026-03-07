-- v17: full work series management
CREATE TABLE "WorkSeries" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkSeries_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Work" ADD COLUMN IF NOT EXISTS "seriesId" TEXT;
ALTER TABLE "Work" ADD COLUMN IF NOT EXISTS "seriesOrder" INTEGER;

CREATE UNIQUE INDEX "WorkSeries_ownerId_slug_key" ON "WorkSeries"("ownerId", "slug");
CREATE INDEX "WorkSeries_ownerId_updatedAt_idx" ON "WorkSeries"("ownerId", "updatedAt");
CREATE INDEX "Work_seriesId_seriesOrder_idx" ON "Work"("seriesId", "seriesOrder");

ALTER TABLE "WorkSeries" ADD CONSTRAINT "WorkSeries_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Work" ADD CONSTRAINT "Work_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "WorkSeries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

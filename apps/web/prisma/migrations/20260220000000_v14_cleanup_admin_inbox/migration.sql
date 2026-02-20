-- Inkura v14:
-- 1) Remove global creator role system (publishType is per-work)
-- 2) Remove matureOptIn (adultConfirmed is enough)
-- 3) Add user -> admin inbox reports

ALTER TABLE "User" DROP COLUMN IF EXISTS "creatorRole";
ALTER TABLE "User" DROP COLUMN IF EXISTS "matureOptIn";

DROP TYPE IF EXISTS "CreatorRole";

CREATE TABLE IF NOT EXISTS "AdminInboxReport" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "pageUrl" TEXT,
  "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
  "reporterId" TEXT NOT NULL,
  "resolverId" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "adminNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AdminInboxReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AdminInboxReport_status_createdAt_idx" ON "AdminInboxReport"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "AdminInboxReport_reporterId_createdAt_idx" ON "AdminInboxReport"("reporterId", "createdAt");

ALTER TABLE "AdminInboxReport" ADD CONSTRAINT IF NOT EXISTS "AdminInboxReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminInboxReport" ADD CONSTRAINT IF NOT EXISTS "AdminInboxReport_resolverId_fkey" FOREIGN KEY ("resolverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- v26: attachments for admin inbox reports (images/files)
DO $$
BEGIN
  CREATE TYPE "AdminInboxReportAttachmentKind" AS ENUM ('IMAGE', 'FILE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "AdminInboxReportAttachment" (
  "id" TEXT NOT NULL,
  "reportId" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "kind" "AdminInboxReportAttachmentKind" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminInboxReportAttachment_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AdminInboxReportAttachment"
  DROP CONSTRAINT IF EXISTS "AdminInboxReportAttachment_reportId_fkey";

ALTER TABLE "AdminInboxReportAttachment"
  ADD CONSTRAINT "AdminInboxReportAttachment_reportId_fkey"
  FOREIGN KEY ("reportId") REFERENCES "AdminInboxReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "AdminInboxReportAttachment_reportId_createdAt_idx"
  ON "AdminInboxReportAttachment"("reportId", "createdAt");

CREATE INDEX IF NOT EXISTS "AdminInboxReportAttachment_kind_createdAt_idx"
  ON "AdminInboxReportAttachment"("kind", "createdAt");

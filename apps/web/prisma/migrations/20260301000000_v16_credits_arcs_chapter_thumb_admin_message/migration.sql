-- v16.3: credits/arcs + chapter thumbnail + admin message notifications

-- Add enum value ADMIN_MESSAGE safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'NotificationType'
      AND e.enumlabel = 'ADMIN_MESSAGE'
  ) THEN
    ALTER TYPE "NotificationType" ADD VALUE 'ADMIN_MESSAGE';
  END IF;
END $$;

-- Work: extra credits + series arc links
ALTER TABLE "Work" ADD COLUMN IF NOT EXISTS "translatorCredit" TEXT;
ALTER TABLE "Work" ADD COLUMN IF NOT EXISTS "companyCredit" TEXT;
ALTER TABLE "Work" ADD COLUMN IF NOT EXISTS "prevArcUrl" TEXT;
ALTER TABLE "Work" ADD COLUMN IF NOT EXISTS "nextArcUrl" TEXT;

-- Chapter: thumbnail
ALTER TABLE "Chapter" ADD COLUMN IF NOT EXISTS "thumbnailImage" TEXT;
ALTER TABLE "Chapter" ADD COLUMN IF NOT EXISTS "thumbnailKey" TEXT;

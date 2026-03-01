-- v16.3: manual credits + arc links + chapter thumbnails + admin notifications

-- 1) Extend NotificationType enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE lower(t.typname) = lower('NotificationType') AND e.enumlabel = 'ADMIN_MESSAGE'
  ) THEN
    ALTER TYPE "NotificationType" ADD VALUE 'ADMIN_MESSAGE';
  END IF;
END $$;

-- 2) Work: credits + arc links
ALTER TABLE "Work" ADD COLUMN IF NOT EXISTS "translatorCredit" TEXT;
ALTER TABLE "Work" ADD COLUMN IF NOT EXISTS "companyCredit" TEXT;
ALTER TABLE "Work" ADD COLUMN IF NOT EXISTS "prevArcUrl" TEXT;
ALTER TABLE "Work" ADD COLUMN IF NOT EXISTS "nextArcUrl" TEXT;

-- 3) Chapter: thumbnail
ALTER TABLE "Chapter" ADD COLUMN IF NOT EXISTS "thumbnailImage" TEXT;
ALTER TABLE "Chapter" ADD COLUMN IF NOT EXISTS "thumbnailKey" TEXT;

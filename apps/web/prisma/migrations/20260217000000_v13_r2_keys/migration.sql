-- Inkura v13: store Cloudflare R2 object keys for delete/ownership/audit.

ALTER TABLE "Work" ADD COLUMN IF NOT EXISTS "coverKey" TEXT;
ALTER TABLE "ComicPage" ADD COLUMN IF NOT EXISTS "imageKey" TEXT;

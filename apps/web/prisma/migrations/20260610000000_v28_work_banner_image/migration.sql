-- v28: optional wide banner image for hero carousel
ALTER TABLE "Work" ADD COLUMN IF NOT EXISTS "bannerImage" TEXT;
ALTER TABLE "Work" ADD COLUMN IF NOT EXISTS "bannerKey" TEXT;

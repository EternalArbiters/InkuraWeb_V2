-- Add optional author/uploader message for a chapter.
-- Use IF NOT EXISTS so re-deploys won't fail if column already exists.

ALTER TABLE "Chapter" ADD COLUMN IF NOT EXISTS "authorNote" TEXT;

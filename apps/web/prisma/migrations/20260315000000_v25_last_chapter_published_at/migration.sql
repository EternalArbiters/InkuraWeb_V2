-- v25: Add lastChapterPublishedAt to Work
-- This field tracks when the most recent chapter was first published.
-- It only changes when a NEW chapter is published for the first time,
-- not when drafting, editing, liking, rating, or reordering.

ALTER TABLE "Work" ADD COLUMN IF NOT EXISTS "lastChapterPublishedAt" TIMESTAMP(3);

-- Backfill: set to the max publishedAt across all published chapters
UPDATE "Work" w
SET "lastChapterPublishedAt" = (
  SELECT MAX(c."publishedAt")
  FROM "Chapter" c
  WHERE c."workId" = w.id
    AND c."status" = 'PUBLISHED'
    AND c."publishedAt" IS NOT NULL
)
WHERE EXISTS (
  SELECT 1 FROM "Chapter" c
  WHERE c."workId" = w.id
    AND c."status" = 'PUBLISHED'
    AND c."publishedAt" IS NOT NULL
);

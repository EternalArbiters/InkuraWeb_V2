-- v16: chapter likes (per-chapter like count)

ALTER TABLE "Chapter" ADD COLUMN IF NOT EXISTS "likeCount" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "ChapterLike" (
  "userId" TEXT NOT NULL,
  "chapterId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChapterLike_pkey" PRIMARY KEY ("userId", "chapterId")
);

ALTER TABLE "ChapterLike" DROP CONSTRAINT IF EXISTS "ChapterLike_userId_fkey";
ALTER TABLE "ChapterLike" DROP CONSTRAINT IF EXISTS "ChapterLike_chapterId_fkey";

ALTER TABLE "ChapterLike" ADD CONSTRAINT "ChapterLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChapterLike" ADD CONSTRAINT "ChapterLike_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "ChapterLike_chapterId_idx" ON "ChapterLike"("chapterId");

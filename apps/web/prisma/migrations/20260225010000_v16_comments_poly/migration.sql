-- v16 alpha1: polymorphic comments + attachments

-- 1) Enums
DO $$ BEGIN
  CREATE TYPE "CommentTargetType" AS ENUM ('WORK', 'CHAPTER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "CommentAttachmentType" AS ENUM ('IMAGE', 'GIF');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2) Comment: add polymorphic target + spoiler + editedAt
ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "targetType" "CommentTargetType" NOT NULL DEFAULT 'CHAPTER';
ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "targetId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "isSpoiler" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "editedAt" TIMESTAMP(3);

-- Migrate existing chapter comments
UPDATE "Comment" SET "targetId" = "chapterId" WHERE ("targetId" = '' OR "targetId" IS NULL);

-- 3) Drop old chapter FK + column
ALTER TABLE "Comment" DROP CONSTRAINT IF EXISTS "Comment_chapterId_fkey";
DROP INDEX IF EXISTS "Comment_chapterId_idx";
ALTER TABLE "Comment" DROP COLUMN IF EXISTS "chapterId";

-- 4) New indexes
CREATE INDEX IF NOT EXISTS "Comment_targetType_targetId_createdAt_idx" ON "Comment"("targetType", "targetId", "createdAt");
CREATE INDEX IF NOT EXISTS "Comment_userId_createdAt_idx" ON "Comment"("userId", "createdAt");

-- 5) CommentAttachment table
CREATE TABLE IF NOT EXISTS "CommentAttachment" (
  "id" TEXT NOT NULL,
  "commentId" TEXT NOT NULL,
  "mediaId" TEXT NOT NULL,
  "type" "CommentAttachmentType" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommentAttachment_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CommentAttachment" DROP CONSTRAINT IF EXISTS "CommentAttachment_commentId_fkey";
ALTER TABLE "CommentAttachment" DROP CONSTRAINT IF EXISTS "CommentAttachment_mediaId_fkey";

ALTER TABLE "CommentAttachment" ADD CONSTRAINT "CommentAttachment_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommentAttachment" ADD CONSTRAINT "CommentAttachment_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "MediaObject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "CommentAttachment_commentId_mediaId_key" ON "CommentAttachment"("commentId", "mediaId");
CREATE INDEX IF NOT EXISTS "CommentAttachment_commentId_idx" ON "CommentAttachment"("commentId");
CREATE INDEX IF NOT EXISTS "CommentAttachment_mediaId_idx" ON "CommentAttachment"("mediaId");

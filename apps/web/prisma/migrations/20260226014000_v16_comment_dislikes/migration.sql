-- v16: comment dislikes

ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "dislikeCount" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "CommentDislike" (
  "userId" TEXT NOT NULL,
  "commentId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommentDislike_pkey" PRIMARY KEY ("userId", "commentId")
);

ALTER TABLE "CommentDislike" DROP CONSTRAINT IF EXISTS "CommentDislike_userId_fkey";
ALTER TABLE "CommentDislike" DROP CONSTRAINT IF EXISTS "CommentDislike_commentId_fkey";

ALTER TABLE "CommentDislike" ADD CONSTRAINT "CommentDislike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommentDislike" ADD CONSTRAINT "CommentDislike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "CommentDislike_commentId_idx" ON "CommentDislike"("commentId");

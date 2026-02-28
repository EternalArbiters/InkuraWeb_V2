-- v16.2: comment notifications (new comment/reply/mention/pinned) + pinned comments

-- 1) Extend NotificationType enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE lower(t.typname) = lower('NotificationType') AND e.enumlabel = 'COMMENT_NEW'
  ) THEN
    ALTER TYPE "NotificationType" ADD VALUE 'COMMENT_NEW';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE lower(t.typname) = lower('NotificationType') AND e.enumlabel = 'COMMENT_REPLY'
  ) THEN
    ALTER TYPE "NotificationType" ADD VALUE 'COMMENT_REPLY';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE lower(t.typname) = lower('NotificationType') AND e.enumlabel = 'COMMENT_MENTION'
  ) THEN
    ALTER TYPE "NotificationType" ADD VALUE 'COMMENT_MENTION';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE lower(t.typname) = lower('NotificationType') AND e.enumlabel = 'COMMENT_PINNED'
  ) THEN
    ALTER TYPE "NotificationType" ADD VALUE 'COMMENT_PINNED';
  END IF;
END $$;

-- 2) Pinned comment fields
ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "isPinned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "pinnedAt" TIMESTAMP(3);
ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "pinnedById" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'Comment_pinnedById_fkey'
  ) THEN
    ALTER TABLE "Comment"
    ADD CONSTRAINT "Comment_pinnedById_fkey"
    FOREIGN KEY ("pinnedById") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Comment_targetType_targetId_isPinned_pinnedAt_idx"
  ON "Comment"("targetType", "targetId", "isPinned", "pinnedAt");

CREATE INDEX IF NOT EXISTS "Comment_pinnedById_idx" ON "Comment"("pinnedById");

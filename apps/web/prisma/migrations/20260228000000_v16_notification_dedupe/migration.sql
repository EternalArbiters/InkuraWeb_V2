-- v16.1: Notification dedupe + structured refs

ALTER TABLE "Notification" ADD COLUMN "workId" TEXT;
ALTER TABLE "Notification" ADD COLUMN "chapterId" TEXT;
ALTER TABLE "Notification" ADD COLUMN "actorId" TEXT;
ALTER TABLE "Notification" ADD COLUMN "dedupeKey" TEXT;

-- allow multiple NULL dedupeKey rows, but prevent duplicates when set
CREATE UNIQUE INDEX "Notification_userId_dedupeKey_key" ON "Notification"("userId", "dedupeKey");

CREATE INDEX "Notification_workId_createdAt_idx" ON "Notification"("workId", "createdAt");
CREATE INDEX "Notification_chapterId_createdAt_idx" ON "Notification"("chapterId", "createdAt");

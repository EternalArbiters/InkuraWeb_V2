-- Stage 7: performance/index hygiene

-- Work lists: published browsing (status + updatedAt / likeCount)
CREATE INDEX IF NOT EXISTS "Work_status_updatedAt_idx" ON "Work"("status", "updatedAt");
CREATE INDEX IF NOT EXISTS "Work_status_likeCount_idx" ON "Work"("status", "likeCount");

-- Notifications: unread count + list for a user
CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt");

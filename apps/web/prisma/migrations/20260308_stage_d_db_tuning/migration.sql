-- Stage D: targeted indexes for public feeds, reader/library, and review sort paths.
CREATE INDEX IF NOT EXISTS "Work_status_type_updatedAt_idx" ON "Work"("status", "type", "updatedAt");
CREATE INDEX IF NOT EXISTS "Work_status_type_likeCount_idx" ON "Work"("status", "type", "likeCount");
CREATE INDEX IF NOT EXISTS "Work_status_publishType_updatedAt_idx" ON "Work"("status", "publishType", "updatedAt");
CREATE INDEX IF NOT EXISTS "Work_status_publishType_likeCount_idx" ON "Work"("status", "publishType", "likeCount");
CREATE INDEX IF NOT EXISTS "Work_status_ratingAvg_ratingCount_updatedAt_idx" ON "Work"("status", "ratingAvg", "ratingCount", "updatedAt");

CREATE INDEX IF NOT EXISTS "Chapter_workId_status_number_createdAt_idx" ON "Chapter"("workId", "status", "number", "createdAt");
CREATE INDEX IF NOT EXISTS "Chapter_status_publishedAt_idx" ON "Chapter"("status", "publishedAt");

CREATE INDEX IF NOT EXISTS "WorkLike_userId_createdAt_idx" ON "WorkLike"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "Bookmark_userId_createdAt_idx" ON "Bookmark"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "ReadingProgress_userId_updatedAt_idx" ON "ReadingProgress"("userId", "updatedAt");
CREATE INDEX IF NOT EXISTS "ReadingProgress_userId_lastReadAt_idx" ON "ReadingProgress"("userId", "lastReadAt");

CREATE INDEX IF NOT EXISTS "Review_workId_rating_createdAt_idx" ON "Review"("workId", "rating", "createdAt");

CREATE INDEX IF NOT EXISTS "ReadingList_ownerId_isPublic_updatedAt_idx" ON "ReadingList"("ownerId", "isPublic", "updatedAt");
CREATE INDEX IF NOT EXISTS "ReadingListItem_listId_addedAt_idx" ON "ReadingListItem"("listId", "addedAt");

CREATE INDEX IF NOT EXISTS "MediaObject_contentType_createdAt_idx" ON "MediaObject"("contentType", "createdAt");

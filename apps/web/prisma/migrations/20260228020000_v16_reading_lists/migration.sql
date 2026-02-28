-- v16.2: Reading Lists / Collections

CREATE TABLE "ReadingList" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "isPublic" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ReadingList_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ReadingList" ADD CONSTRAINT "ReadingList_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "ReadingList_slug_key" ON "ReadingList"("slug");
CREATE INDEX "ReadingList_ownerId_updatedAt_idx" ON "ReadingList"("ownerId", "updatedAt");
CREATE INDEX "ReadingList_isPublic_updatedAt_idx" ON "ReadingList"("isPublic", "updatedAt");

CREATE TABLE "ReadingListItem" (
  "id" TEXT NOT NULL,
  "listId" TEXT NOT NULL,
  "workId" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ReadingListItem_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ReadingListItem" ADD CONSTRAINT "ReadingListItem_listId_fkey"
  FOREIGN KEY ("listId") REFERENCES "ReadingList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReadingListItem" ADD CONSTRAINT "ReadingListItem_workId_fkey"
  FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "ReadingListItem_listId_workId_key" ON "ReadingListItem"("listId", "workId");
CREATE INDEX "ReadingListItem_listId_sortOrder_idx" ON "ReadingListItem"("listId", "sortOrder");
CREATE INDEX "ReadingListItem_workId_idx" ON "ReadingListItem"("workId");

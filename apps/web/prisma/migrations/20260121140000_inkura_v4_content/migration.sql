-- Inkura v4 schema sync: add updatedAt + content tables

PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- Redefine User to match schema (add updatedAt + default role)
CREATE TABLE "new_User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "name" TEXT,
  "image" TEXT,
  "role" TEXT NOT NULL DEFAULT 'USER',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "new_User" ("createdAt", "email", "id", "image", "name", "password", "role", "username")
SELECT
  "createdAt",
  "email",
  "id",
  "image",
  "name",
  "password",
  CASE WHEN "role" IS NULL OR "role" = '' THEN 'USER' ELSE "role" END,
  "username"
FROM "User";

DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- Create Work
CREATE TABLE "Work" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "coverImage" TEXT,
  "authorId" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Work_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Work_slug_key" ON "Work"("slug");
CREATE INDEX "Work_authorId_idx" ON "Work"("authorId");
CREATE INDEX "Work_type_status_idx" ON "Work"("type", "status");

-- Create Chapter
CREATE TABLE "Chapter" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workId" TEXT NOT NULL,
  "number" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "publishedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Chapter_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Chapter_workId_number_key" ON "Chapter"("workId", "number");
CREATE INDEX "Chapter_workId_idx" ON "Chapter"("workId");

-- Create ChapterText (NOVEL)
CREATE TABLE "ChapterText" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "chapterId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChapterText_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ChapterText_chapterId_key" ON "ChapterText"("chapterId");

-- Create ComicPage (COMIC)
CREATE TABLE "ComicPage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "chapterId" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ComicPage_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ComicPage_chapterId_order_key" ON "ComicPage"("chapterId", "order");
CREATE INDEX "ComicPage_chapterId_idx" ON "ComicPage"("chapterId");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

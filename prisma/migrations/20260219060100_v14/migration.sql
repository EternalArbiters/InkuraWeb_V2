-- v14: adultConfirmed + Work + Report + nullable password

PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- Redefine User (add adultConfirmed, allow password NULL)
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT,
    "image" TEXT,
    "role" TEXT NOT NULL,
    "adultConfirmed" BOOLEAN NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "new_User" ("createdAt", "email", "id", "name", "password", "role", "username", "image")
SELECT "createdAt", "email", "id", "name", "password", "role", "username", "image" FROM "User";

DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- Work
CREATE TABLE "Work" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "genres" TEXT NOT NULL DEFAULT '',
    "nsfw" BOOLEAN NOT NULL DEFAULT 0,
    "postingRole" TEXT NOT NULL DEFAULT 'AUTHOR',
    "coverDataUrl" TEXT,
    "coverMime" TEXT,
    "creatorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Work_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Work_creatorId_idx" ON "Work"("creatorId");

-- Report
CREATE TABLE "Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reporterId" TEXT NOT NULL,
    CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Report_reporterId_idx" ON "Report"("reporterId");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

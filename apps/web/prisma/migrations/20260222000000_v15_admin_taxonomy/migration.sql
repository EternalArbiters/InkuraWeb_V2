-- V15 Patch 1: Admin-manageable taxonomy + admin audit log

-- 1) Taxonomy: add soft-delete/sort metadata (additive)
ALTER TABLE "Genre"
  ADD COLUMN IF NOT EXISTS "isActive"  BOOLEAN     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "isSystem"  BOOLEAN     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "isLocked"  BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Tag"
  ADD COLUMN IF NOT EXISTS "isActive"  BOOLEAN     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "isSystem"  BOOLEAN     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "isLocked"  BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "WarningTag"
  ADD COLUMN IF NOT EXISTS "isActive"  BOOLEAN     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "isSystem"  BOOLEAN     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "isLocked"  BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "DeviantLoveTag"
  ADD COLUMN IF NOT EXISTS "isActive"  BOOLEAN     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "isSystem"  BOOLEAN     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "isLocked"  BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Indexes to support active/sorted reads
CREATE INDEX IF NOT EXISTS "Genre_isActive_sortOrder_idx" ON "Genre" ("isActive", "sortOrder");
CREATE INDEX IF NOT EXISTS "Tag_isActive_sortOrder_idx" ON "Tag" ("isActive", "sortOrder");
CREATE INDEX IF NOT EXISTS "WarningTag_isActive_sortOrder_idx" ON "WarningTag" ("isActive", "sortOrder");
CREATE INDEX IF NOT EXISTS "DeviantLoveTag_isActive_sortOrder_idx" ON "DeviantLoveTag" ("isActive", "sortOrder");

-- 2) Admin audit log
CREATE TABLE IF NOT EXISTS "AdminAuditLog" (
  "id"        TEXT        NOT NULL,
  "adminId"   TEXT        NOT NULL,
  "action"    TEXT        NOT NULL,
  "entity"    TEXT        NOT NULL,
  "entityId"  TEXT        NOT NULL,
  "beforeJson" JSONB,
  "afterJson"  JSONB,
  "ip"        TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- FK to User
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AdminAuditLog_adminId_fkey'
  ) THEN
    ALTER TABLE "AdminAuditLog"
      ADD CONSTRAINT "AdminAuditLog_adminId_fkey"
      FOREIGN KEY ("adminId") REFERENCES "User"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS "AdminAuditLog_adminId_createdAt_idx" ON "AdminAuditLog" ("adminId", "createdAt");
CREATE INDEX IF NOT EXISTS "AdminAuditLog_entity_entityId_createdAt_idx" ON "AdminAuditLog" ("entity", "entityId", "createdAt");

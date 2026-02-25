-- v16 prep: media de-dup table for comment attachments

-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MediaObjectType') THEN
    CREATE TYPE "MediaObjectType" AS ENUM ('COMMENT_IMAGE', 'COMMENT_GIF');
  END IF;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "MediaObject" (
  "id" TEXT NOT NULL,
  "sha256" TEXT NOT NULL,
  "type" "MediaObjectType" NOT NULL,
  "contentType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "key" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MediaObject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "MediaObject_sha256_key" ON "MediaObject"("sha256");
CREATE INDEX IF NOT EXISTS "MediaObject_type_createdAt_idx" ON "MediaObject"("type", "createdAt");

-- v12: creator role + adult confirmed + publish type + translator

-- CreateEnum
CREATE TYPE "CreatorRole" AS ENUM ('READER', 'AUTHOR', 'TRANSLATOR', 'UPLOADER');

-- CreateEnum
CREATE TYPE "WorkPublishType" AS ENUM ('ORIGINAL', 'TRANSLATION', 'REUPLOAD');

-- AlterTable
ALTER TABLE "User"
ADD COLUMN     "creatorRole" "CreatorRole" NOT NULL DEFAULT 'READER',
ADD COLUMN     "adultConfirmed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Work"
ADD COLUMN     "publishType" "WorkPublishType" NOT NULL DEFAULT 'ORIGINAL',
ADD COLUMN     "originalAuthorCredit" TEXT,
ADD COLUMN     "sourceUrl" TEXT,
ADD COLUMN     "uploaderNote" TEXT,
ADD COLUMN     "translatorId" TEXT;

-- CreateIndex
CREATE INDEX "Work_publishType_idx" ON "Work"("publishType");

-- CreateIndex
CREATE INDEX "Work_translatorId_idx" ON "Work"("translatorId");

-- AddForeignKey
ALTER TABLE "Work" ADD CONSTRAINT "Work_translatorId_fkey" FOREIGN KEY ("translatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

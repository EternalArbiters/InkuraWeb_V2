-- DropIndex
DROP INDEX "Comment_userId_idx";

-- AlterTable
ALTER TABLE "Comment" ALTER COLUMN "targetType" DROP DEFAULT,
ALTER COLUMN "targetId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "DeviantLoveTag" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Genre" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Tag" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "WarningTag" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- RenameIndex
ALTER INDEX "Comment_target_parent_created_idx" RENAME TO "Comment_targetType_targetId_parentId_createdAt_idx";

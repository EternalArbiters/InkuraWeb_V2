-- DropForeignKey
ALTER TABLE "AdminInboxReport" DROP CONSTRAINT "AdminInboxReport_reporterId_fkey";

-- AlterTable
ALTER TABLE "AdminInboxReport" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "AdminInboxReport" ADD CONSTRAINT "AdminInboxReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

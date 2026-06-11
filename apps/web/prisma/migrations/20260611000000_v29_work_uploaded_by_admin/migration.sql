-- v29: track which admin uploaded a work on behalf of a user
ALTER TABLE "Work" ADD COLUMN IF NOT EXISTS "uploadedByAdminId" TEXT;

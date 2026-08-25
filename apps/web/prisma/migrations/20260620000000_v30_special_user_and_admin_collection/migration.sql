-- v30: private-deployment support
-- 1) New role for admin-invited friends (login-only, no self-registration).
-- 2) Per-work flag so SPECIAL_USER (and ADMIN) can see a DRAFT work + all its
--    chapters even though it hasn't been published yet.
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SPECIAL_USER';

ALTER TABLE "Work" ADD COLUMN IF NOT EXISTS "isAdminCollection" BOOLEAN NOT NULL DEFAULT false;

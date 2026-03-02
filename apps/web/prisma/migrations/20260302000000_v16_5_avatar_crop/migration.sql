-- v16.5: user avatar crop controls (position + zoom)

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarFocusX" INTEGER;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarFocusY" INTEGER;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarZoom" DOUBLE PRECISION;

-- v16.5: allow users to adjust avatar position/zoom (PP crop framing)

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarFocusX" INTEGER;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarFocusY" INTEGER;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarZoom" DOUBLE PRECISION;

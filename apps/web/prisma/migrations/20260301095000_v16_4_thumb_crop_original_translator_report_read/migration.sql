-- v16.4: chapter thumbnail crop controls + original translator credit + admin-report read markers

-- Work: require original translator credit for reupload flows (stored as optional text)
ALTER TABLE "Work" ADD COLUMN IF NOT EXISTS "originalTranslatorCredit" TEXT;

-- Chapter: allow adjusting thumbnail zoom + focal point (stored as percent and zoom)
ALTER TABLE "Chapter" ADD COLUMN IF NOT EXISTS "thumbnailFocusX" INTEGER;
ALTER TABLE "Chapter" ADD COLUMN IF NOT EXISTS "thumbnailFocusY" INTEGER;
ALTER TABLE "Chapter" ADD COLUMN IF NOT EXISTS "thumbnailZoom" DOUBLE PRECISION;

-- Admin inbox reports: track read state for badge + dim UI
ALTER TABLE "AdminInboxReport" ADD COLUMN IF NOT EXISTS "reporterReadAt" TIMESTAMP(3);
ALTER TABLE "AdminInboxReport" ADD COLUMN IF NOT EXISTS "adminReadAt" TIMESTAMP(3);

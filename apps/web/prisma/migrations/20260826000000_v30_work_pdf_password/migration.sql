-- v30: one shared password per work, used to unlock this work's own password-protected
-- PDFs during Studio's PDF-to-pages import.
ALTER TABLE "Work" ADD COLUMN IF NOT EXISTS "pdfPassword" TEXT;

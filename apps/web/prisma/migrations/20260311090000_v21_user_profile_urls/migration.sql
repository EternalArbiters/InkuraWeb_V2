ALTER TABLE "User" ADD COLUMN "profileUrlsJson" TEXT NOT NULL DEFAULT '[]';

UPDATE "User"
SET "profileUrlsJson" = CASE
  WHEN "profileUrl" IS NULL OR BTRIM("profileUrl") = '' THEN '[]'
  ELSE json_build_array("profileUrl")::text
END;

ALTER TABLE "Work" ADD COLUMN "subtitleJson" TEXT NOT NULL DEFAULT '[]';

UPDATE "Work"
SET "subtitleJson" = CASE
  WHEN COALESCE(BTRIM("subtitle"), '') = '' THEN '[]'
  ELSE CONCAT('[', to_jsonb(BTRIM("subtitle"))::text, ']')
END;

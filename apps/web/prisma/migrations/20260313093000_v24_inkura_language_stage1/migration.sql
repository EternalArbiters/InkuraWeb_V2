DO $$
BEGIN
  CREATE TYPE "InkuraLanguage" AS ENUM ('EN', 'ID');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "inkuraLanguage" "InkuraLanguage";

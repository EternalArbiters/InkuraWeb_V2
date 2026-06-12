-- Fix: translator was incorrectly set to admin instead of the actual creator/uploader
-- Affected works: translatorId = admin's ID, but authorId is a different user
-- Run this in Neon Console (SQL Editor)

-- Step 1: Preview what will be fixed (run this first to verify)
SELECT
  w.id,
  w.slug,
  w.title,
  a.name  AS author_name,
  t.name  AS translator_name,
  w."uploadedByAdminId"
FROM "Work" w
JOIN "User" a ON a.id = w."authorId"
JOIN "User" t ON t.id = w."translatorId"
WHERE w."translatorId" = (SELECT id FROM "User" WHERE name = 'Noeleph Goddess' LIMIT 1)
  AND w."authorId"     != (SELECT id FROM "User" WHERE name = 'Noeleph Goddess' LIMIT 1);

-- Step 2: Apply the fix (run after confirming Step 1 shows the right rows)
UPDATE "Work"
SET
  "translatorId"      = "authorId",
  "uploadedByAdminId" = COALESCE(
    "uploadedByAdminId",
    (SELECT id FROM "User" WHERE name = 'Noeleph Goddess' LIMIT 1)
  )
WHERE
  "translatorId" = (SELECT id FROM "User" WHERE name = 'Noeleph Goddess' LIMIT 1)
  AND "authorId" != (SELECT id FROM "User" WHERE name = 'Noeleph Goddess' LIMIT 1);
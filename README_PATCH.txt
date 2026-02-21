Inkura V14 Deviant Love + NSFW taxonomy patch

How to apply:
1) Copy this patch folder contents over your repo root (it only contains changed files).
   On Windows PowerShell from your repo root:
     Copy-Item -Recurse -Force .\deviant_patch\apps\web\* .\apps\web\
   (or manually copy the files under apps/web matching the same paths)

2) Ensure your apps/web/.env has DATABASE_URL and DIRECT_URL.

3) Run migrations and seed:
   cd apps/web
   npm run db:migrate
   npm run db:seed

4) Remove legacy genres from DB (if they still show in /api/genres):
   npm run db:cleanup-taxonomy

5) Commit and push.

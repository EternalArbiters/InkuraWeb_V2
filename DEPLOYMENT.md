# Inkura Deployment (Shortcut)

Lihat detailnya di:
- `apps/web/docs/V15_DEPLOYMENT_NOTES.md`

TL;DR:
- Pastikan ENV wajib ada: `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- Vercel akan menjalankan script `vercel-build` (env check → prisma generate → migrate deploy → next build)
- Preview migrations default **OFF** (aktifkan dengan `INKURA_MIGRATE_PREVIEW=1` + gunakan DB preview terpisah)

# Inkura Deployment (Shortcut)

Lihat detailnya di:
- `apps/web/docs/V15_DEPLOYMENT_NOTES.md`

TL;DR:
- Pastikan ENV wajib ada: `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- Vercel akan menjalankan script `vercel-build` (env check → prisma generate → migrate deploy → next build)
- Preview migrations default **OFF** (aktifkan dengan `INKURA_MIGRATE_PREVIEW=1` + gunakan DB preview terpisah)


R2 env (pilih salah satu style):
- Style endpoint: `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL`
- Style account id: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_BASE_URL`

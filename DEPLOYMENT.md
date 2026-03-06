# Inkura Deployment (Shortcut)

Untuk panduan deploy final stage 10, buka:

- `docs/deployment-runbook.md`
- `docs/env-vars.md`

Catatan historis yang masih relevan:

- `apps/web/docs/V15_DEPLOYMENT_NOTES.md`

## TL;DR

- target deploy utama: **Vercel + Neon + Cloudflare R2**
- env wajib: `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- upload butuh env R2 yang lengkap
- build pipeline memakai `vercel-build`
- production menjalankan `prisma migrate deploy`
- preview default **tidak** auto-migrate kecuali `INKURA_MIGRATE_PREVIEW=1`

# Inkura Deployment (Shortcut)

For the final stage 10 deployment guide, open:

- `docs/deployment-runbook.md`
- `docs/env-vars.md`

Catatan historis that still relevant:

- `apps/web/docs/V15_DEPLOYMENT_NOTES.md`

## TL;DR

- target deploy main: **Vercel + Neon + Cloudflare R2**
- required env: `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- upload butuh env R2 that lengkap
- build pipeline memakai `vercel-build`
- production menjalankan `prisma migrate deploy`
- preview default **not** auto-migrate kecuali `INKURA_MIGRATE_PREVIEW=1`

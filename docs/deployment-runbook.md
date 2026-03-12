# Deployment runbook

This document memandu deploy repo Inkura cleaned to kombinasi **Vercel + Neon Postgres + Cloudflare R2**.

## Target deploy

- App runtime: Vercel
- Database: Neon Postgres
- Asset storage: Cloudflare R2
- Email reset password: Resend (optional)

## Pilihan root directory in Vercel

This repo mendukung dua model:

### Opsi A — project root = repo root

- Root Directory Vercel: kosong / repo root
- Script build used: root `vercel-build`

### Opsi B — project root = `apps/web`

- Root Directory Vercel: `apps/web`
- Script build used: `apps/web` `vercel-build`

For repo cleaned this, that most mudah biasanya **repo root**, because command workspace in root already disediakan.

## Env that required in Vercel

Minimal must include:

```env
DATABASE_URL=
DIRECT_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
```

Env that sangat disarankan for features upload:

```env
R2_ENDPOINT=            # atau R2_ACCOUNT_ID
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=              # atau R2_BUCKET_NAME
R2_PUBLIC_BASE_URL=
```

Env optional:

```env
RESEND_API_KEY=
EMAIL_FROM=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
INKURA_LOG_LEVEL=warn
INKURA_LOG_REQUESTS=
INKURA_SERVICE_NAME=inkura-web
```

## Build pipeline that dijalankan

Script `vercel-build` akan melakukan this:

1. `deploy:check-env`
2. `prisma generate`
3. `prisma migrate deploy` if environment memenuhi syarat
4. `next build`

### Kapan migration dijalankan

- `production` → sethen menjalankan `prisma migrate deploy`
- `development` → menjalankan `prisma migrate deploy`
- `preview` → **default not migrate**
- `preview` + `INKURA_MIGRATE_PREVIEW=1` → migrate dijalankan

Kenapa preview default not migrate:

- to prevent preview deployment without intentionally memigrasikan DB production or shared DB

## Konfigurasi Neon that benar

Gunakan pemisahan this:

- `DATABASE_URL` → connection pooled for runtime
- `DIRECT_URL` → connection direct for migrate

If `DIRECT_URL` is wrong, the build can pass env checks but fail during `prisma migrate deploy`.

## Checklist before deploy

1. `npm run verify` lolos local
2. env production already lengkap
3. migration that dibutuhkan already there is in repo
4. `R2_PUBLIC_BASE_URL` already point to domain public that benar
5. if memakai preview auto-migrate, make sure preview DB terpisah from production

## Checklist sealready deploy

Lakukan smoke check minimal:

- buka page public seperti `/home` or `/browse`
- login with user that valid
- buka `/studio`
- buka satu page work and reader
- coba presign upload cover or comic page
- check endpoint auth/session berjalan stabil
- check error response memiliki header `x-request-id`

Lalu continuekan with checklist manual that more lengkap in `REGRESSION_CHECKLIST.md`.

## Failure modes that most general

### Build failed because required env vars are missing

Periksa:

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

### Build fails during `prisma migrate deploy`

Biasanya penyebabnya salah satu from this:

- `DIRECT_URL` point to pooled URL, not a direct URL
- permission DB not cukup for migrate
- preview deployment memakai DB that not semestinya

### Upload jalan in local tapi fails in production

Periksa:

- all env R2 there is
- `R2_PUBLIC_BASE_URL` benar
- bucket/object policy or custom domain public already benar
- user login and punya ownership work/chapter that sesuai

## Dokumen terkait

- `env-vars.md`
- `database-reset-and-seeding.md`
- `debug-upload-issues.md`
- `../apps/web/docs/V15_DEPLOYMENT_NOTES.md` for catatan historis that still relevant

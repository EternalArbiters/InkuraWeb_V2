# Inkura V15 Deployment Notes (Vercel + Neon)

This document fokus to **guardrails deploy** so that:
- Prisma Client sethen sinkron
- Migrasi DB jalan otomatis (and safe)
- Build Vercel fail-fast if ENV penting not yet in-set

## 1) Recommended setup: Vercel Project Root
Kamu punya 2 opsi (dua-duanya already didukung oleh patch V15):

### Opsi A (paling simpel): Root Directory = repo root
- Vercel → Project Settings → **Root Directory**: biarkan kosong (repo root)
- Vercel otomatis menjalankan script **`vercel-build`** from root.

### Opsi B: Root Directory = `apps/web`
- Vercel → Project Settings → **Root Directory**: `apps/web`
- Vercel akan use script **`vercel-build`** from `apps/web`.

> Keduanya akan menjalankan: env check → prisma generate → (optional) migrate deploy → next build.

## 2) ENV that required (Production)
Set in Vercel: Project Settings → Environment Variables (Production)

### Database (Neon)
- `DATABASE_URL` = **pooled** connection string (for runtime)
- `DIRECT_URL` = **direct** connection string (for migration)

### NextAuth
- `NEXTAUTH_URL` = URL domain production (example: `https://inkura.vercel.app` or domain custom)
- `NEXTAUTH_SECRET` = secret random (example generate via `openssl rand -base64 32`)

## 3) ENV that sangat disarankan (features Inkura)
If kosong, several features upload akan error.

### Cloudflare R2
- `R2_PUBLIC_BASE_URL` (base URL for akses public file/cover)

Inkura support dua style penamaan env (lihat `apps/web/server/storage/r2.ts`):

**Style A (explicit endpoint, cocok for local/dev):**
- `R2_ENDPOINT` (example: `https://<accountId>.r2.cloudflarestorage.com`)
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `R2_PUBLIC_BASE_URL`

**Style B (account id, endpoint dihitung otomatis):**
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_BASE_URL`

> Note: in Vercel, cukup pilih salah satu style. Do not commit credentials to repo.


## 4) Preview deployments (PENTING)
Secara default, patch V15 **TIDAK menjalankan** `prisma migrate deploy` in preview.
Alasannya: mencegah kasus fatal **preview deploy** without intentionally migrate DB production.

If kamu punya **preview DB terpisah**, and ingin preview auto-migrate:
- Set env **Preview**: `INKURA_MIGRATE_PREVIEW=1`
- Pastikan `DATABASE_URL/DIRECT_URL` Preview point to DB preview (not production)

## 5) Apa that dilakukan script `vercel-build`
Script there is in:
- `apps/web/scripts/vercel-build.js`

Urutannya:
1) `deploy:check-env` (fail-fast if ENV required hilang)
2) `prisma generate`
3) `prisma migrate deploy` (production sethen, preview only if `INKURA_MIGRATE_PREVIEW=1`)
4) `next build`

## 6) Troubleshooting cepat
### Build fail: missing REQUIRED env vars
Artinya Vercel not yet punya `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_URL`, or `NEXTAUTH_SECRET`.

### Prisma migrate deploy fail in Vercel
- Cek `DIRECT_URL` benar (direct, not pooled)
- Pastikan user DB punya permission migrate

### Upload cover/page error runtime
- Cek all env R2 in-set (lihat bagian 3)


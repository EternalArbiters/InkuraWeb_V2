# Inkura V15 Deployment Notes (Vercel + Neon)

Dokumen ini fokus ke **guardrails deploy** supaya:
- Prisma Client selalu sinkron
- Migrasi DB jalan otomatis (dan aman)
- Build Vercel fail-fast kalau ENV penting belum di-set

## 1) Recommended setup: Vercel Project Root
Kamu punya 2 opsi (dua-duanya sudah didukung oleh patch V15):

### Opsi A (paling simpel): Root Directory = repo root
- Vercel → Project Settings → **Root Directory**: biarkan kosong (repo root)
- Vercel otomatis menjalankan script **`vercel-build`** dari root.

### Opsi B: Root Directory = `apps/web`
- Vercel → Project Settings → **Root Directory**: `apps/web`
- Vercel akan pakai script **`vercel-build`** dari `apps/web`.

> Keduanya akan menjalankan: env check → prisma generate → (optional) migrate deploy → next build.

## 2) ENV yang wajib (Production)
Set di Vercel: Project Settings → Environment Variables (Production)

### Database (Neon)
- `DATABASE_URL` = **pooled** connection string (untuk runtime)
- `DIRECT_URL` = **direct** connection string (untuk migration)

### NextAuth
- `NEXTAUTH_URL` = URL domain production (contoh: `https://inkura.vercel.app` atau domain custom)
- `NEXTAUTH_SECRET` = secret random (contoh generate via `openssl rand -base64 32`)

## 3) ENV yang sangat disarankan (fitur Inkura)
Kalau kosong, beberapa fitur upload akan error.

### Cloudflare R2
- `R2_PUBLIC_BASE_URL` (base URL untuk akses publik file/cover)

Inkura support dua style penamaan env (lihat `apps/web/server/storage/r2.ts`):

**Style A (explicit endpoint, cocok untuk local/dev):**
- `R2_ENDPOINT` (contoh: `https://<accountId>.r2.cloudflarestorage.com`)
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

> Catatan: di Vercel, cukup pilih salah satu style. Jangan commit credentials ke repo.


## 4) Preview deployments (PENTING)
Secara default, patch V15 **TIDAK menjalankan** `prisma migrate deploy` di preview.
Alasannya: mencegah kasus fatal **preview deploy** tanpa sengaja migrate DB production.

Kalau kamu punya **preview DB terpisah**, dan ingin preview auto-migrate:
- Set env **Preview**: `INKURA_MIGRATE_PREVIEW=1`
- Pastikan `DATABASE_URL/DIRECT_URL` Preview menunjuk DB preview (bukan production)

## 5) Apa yang dilakukan script `vercel-build`
Script ada di:
- `apps/web/scripts/vercel-build.js`

Urutannya:
1) `deploy:check-env` (fail-fast kalau ENV wajib hilang)
2) `prisma generate`
3) `prisma migrate deploy` (production selalu, preview hanya jika `INKURA_MIGRATE_PREVIEW=1`)
4) `next build`

## 6) Troubleshooting cepat
### Build fail: missing REQUIRED env vars
Artinya Vercel belum punya `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_URL`, atau `NEXTAUTH_SECRET`.

### Prisma migrate deploy fail di Vercel
- Cek `DIRECT_URL` benar (direct, bukan pooled)
- Pastikan user DB punya permission migrate

### Upload cover/page error runtime
- Cek semua env R2 di-set (lihat bagian 3)


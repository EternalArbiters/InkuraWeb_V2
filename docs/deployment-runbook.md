# Deployment runbook

Dokumen ini memandu deploy repo Inkura cleaned ke kombinasi **Vercel + Neon Postgres + Cloudflare R2**.

## Target deploy

- App runtime: Vercel
- Database: Neon Postgres
- Asset storage: Cloudflare R2
- Email reset password: Resend (opsional)

## Pilihan root directory di Vercel

Repo ini mendukung dua model:

### Opsi A — project root = repo root

- Root Directory Vercel: kosong / repo root
- Script build yang dipakai: root `vercel-build`

### Opsi B — project root = `apps/web`

- Root Directory Vercel: `apps/web`
- Script build yang dipakai: `apps/web` `vercel-build`

Untuk repo cleaned ini, yang paling mudah biasanya **repo root**, karena command workspace di root sudah disediakan.

## Env yang wajib di Vercel

Minimal wajib ada:

```env
DATABASE_URL=
DIRECT_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
```

Env yang sangat disarankan untuk fitur upload:

```env
R2_ENDPOINT=            # atau R2_ACCOUNT_ID
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=              # atau R2_BUCKET_NAME
R2_PUBLIC_BASE_URL=
```

Env opsional:

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

## Build pipeline yang dijalankan

Script `vercel-build` akan melakukan ini:

1. `deploy:check-env`
2. `prisma generate`
3. `prisma migrate deploy` bila environment memenuhi syarat
4. `next build`

### Kapan migration dijalankan

- `production` → selalu menjalankan `prisma migrate deploy`
- `development` → menjalankan `prisma migrate deploy`
- `preview` → **default tidak migrate**
- `preview` + `INKURA_MIGRATE_PREVIEW=1` → migrate dijalankan

Kenapa preview default tidak migrate:

- untuk mencegah preview deployment tanpa sengaja memigrasikan DB production atau shared DB

## Konfigurasi Neon yang benar

Gunakan pemisahan ini:

- `DATABASE_URL` → koneksi pooled untuk runtime
- `DIRECT_URL` → koneksi direct untuk migrate

Kalau `DIRECT_URL` salah, build bisa lolos env check tetapi gagal saat `prisma migrate deploy`.

## Checklist sebelum deploy

1. `npm run verify` lolos lokal
2. env production sudah lengkap
3. migration yang dibutuhkan sudah ada di repo
4. `R2_PUBLIC_BASE_URL` sudah menunjuk domain publik yang benar
5. kalau memakai preview auto-migrate, pastikan preview DB terpisah dari production

## Checklist sesudah deploy

Lakukan smoke check minimal:

- buka halaman publik seperti `/home` atau `/browse`
- login dengan user yang valid
- buka `/studio`
- buka satu halaman work dan reader
- coba presign upload cover atau comic page
- cek endpoint auth/session berjalan stabil
- cek error response memiliki header `x-request-id`

Lalu lanjutkan dengan checklist manual yang lebih lengkap di `REGRESSION_CHECKLIST.md`.

## Failure modes yang paling umum

### Build gagal karena missing required env vars

Periksa:

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

### Build gagal saat `prisma migrate deploy`

Biasanya penyebabnya salah satu dari ini:

- `DIRECT_URL` menunjuk pooled URL, bukan direct URL
- permission DB tidak cukup untuk migrate
- preview deployment memakai DB yang tidak semestinya

### Upload jalan di lokal tapi gagal di production

Periksa:

- semua env R2 ada
- `R2_PUBLIC_BASE_URL` benar
- bucket/object policy atau custom domain publik sudah benar
- user login dan punya ownership work/chapter yang sesuai

## Dokumen terkait

- `env-vars.md`
- `database-reset-and-seeding.md`
- `debug-upload-issues.md`
- `../apps/web/docs/V15_DEPLOYMENT_NOTES.md` untuk catatan historis yang masih relevan

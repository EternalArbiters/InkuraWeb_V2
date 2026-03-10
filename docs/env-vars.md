# Env vars reference

Dokumen ini adalah sumber kebenaran env vars untuk repo Inkura cleaned stage 10.

File contoh yang dipakai developer:

```bash
cp apps/web/.env.example apps/web/.env.local
```

## Prinsip umum

- `DATABASE_URL` dipakai untuk runtime Prisma
- `DIRECT_URL` dipakai untuk migration Prisma
- `NEXTAUTH_URL` harus menunjuk origin publik yang benar
- Upload butuh konfigurasi R2 yang valid
- Password reset email butuh Resend bila mau benar-benar kirim email
- Untuk lokal, beberapa env boleh dummy atau dikosongkan selama fitur terkait tidak dipakai

## Env wajib

### Database

```env
DATABASE_URL=
DIRECT_URL=
```

- `DATABASE_URL`: koneksi pooled untuk runtime app
- `DIRECT_URL`: koneksi direct untuk migrate / schema operations

### NextAuth

```env
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
```

- `NEXTAUTH_SECRET`: secret acak untuk session/auth
- `NEXTAUTH_URL`: origin kanonik app, wajib akurat di production

## Env sangat disarankan untuk fitur upload

Repo menerima dua style penamaan untuk R2. Pilih salah satu style, jangan dicampur tanpa alasan.

### Style A — explicit endpoint

```env
R2_ENDPOINT=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_BASE_URL=
```

### Style B — account id

```env
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_BASE_URL=
```

Catatan:

- kode juga menerima alias legacy `CLOUDFLARE_R2_*`
- `R2_PUBLIC_BASE_URL` harus menunjuk base URL publik yang benar, misalnya custom domain CDN
- kalau env upload tidak lengkap, presign atau preview asset bisa gagal

## Env opsional untuk email dan password reset

```env
RESEND_API_KEY=
EMAIL_FROM="Inkura <no-reply@example.com>"
RESET_PASSWORD_URL_BASE=http://localhost:3000
APP_BASE_URL=http://localhost:3000
SHOW_RESET_TOKEN=1
```

Keterangan:

- `RESEND_API_KEY` + `EMAIL_FROM` dibutuhkan untuk benar-benar mengirim email reset password
- `RESET_PASSWORD_URL_BASE` diprioritaskan untuk membentuk link reset password
- `APP_BASE_URL` adalah fallback tambahan
- `SHOW_RESET_TOKEN=1` berguna untuk lokal/dev bila belum menghubungkan email

Catatan penting:

- nama env yang dipakai backend adalah **`SHOW_RESET_TOKEN`**, bukan `NEXT_PUBLIC_SHOW_RESET_TOKEN`

## Env opsional untuk frontend origin fallback

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Dipakai sebagai fallback oleh helper server-side `apiJson()` saat origin tidak bisa disimpulkan dari header request.

## Env opsional untuk OAuth

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
```

Kosongkan jika provider tersebut tidak dipakai.


## Env opsional untuk throttling / rate limit

```env
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Keterangan:

- dipakai oleh limiter server-side berbasis Upstash Redis
- bila dua env ini tidak diisi, limiter tidak crash, tetapi otomatis bypass sambil mencatat warning
- isi nilainya dari dashboard database Upstash Redis yang kamu pakai

## Env opsional untuk observability

```env
INKURA_LOG_LEVEL=info
INKURA_LOG_REQUESTS=
INKURA_SERVICE_NAME=
```

- `INKURA_LOG_LEVEL`: `debug`, `info`, `warn`, atau `error`
- `INKURA_LOG_REQUESTS=1`: log semua request API, berguna untuk debugging tapi bisa berisik
- `INKURA_SERVICE_NAME`: label service di structured log

## Env opsional untuk deploy preview

```env
INKURA_MIGRATE_PREVIEW=
```

- set `1` hanya jika preview deployment punya database preview yang terpisah dan memang boleh auto-migrate

## Env opsional untuk Playwright smoke

```env
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000
E2E_ADMIN_EMAIL=noelephgoddess.game@gmail.com
E2E_ADMIN_PASSWORD=admin123
```

Kalau tidak diisi, smoke test lokal akan memakai default yang tersedia di seed dan konfigurasi Playwright.

## Contoh minimal untuk lokal

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
NEXTAUTH_SECRET="dev-secret"
NEXTAUTH_URL="http://localhost:3000"
SHOW_RESET_TOKEN="1"
R2_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET="inkura-dev"
R2_PUBLIC_BASE_URL="https://cdn.example.test"
```

## Checklist cepat kalau env terasa salah

- login loop atau session aneh → cek `NEXTAUTH_URL` dan `NEXTAUTH_SECRET`
- migration gagal → cek `DIRECT_URL`
- upload presign gagal → cek env R2 lengkap
- image berhasil upload tapi tidak tampil → cek `R2_PUBLIC_BASE_URL`
- forgot password tidak kirim email → cek `RESEND_API_KEY` dan `EMAIL_FROM`

## Env opsional untuk metrik performa Tahap F

```env
INKURA_SLOW_ROUTE_MS=600
INKURA_SLOW_PAGE_RENDER_MS=900
INKURA_SLOW_QUERY_MS=250
INKURA_CLIENT_WARN_MS=4000
INKURA_LOG_QUERIES=
```

Keterangan:

- `INKURA_SLOW_ROUTE_MS`: threshold warning untuk API route lambat
- `INKURA_SLOW_PAGE_RENDER_MS`: threshold warning untuk server page render lambat
- `INKURA_SLOW_QUERY_MS`: threshold warning untuk query Prisma lambat
- `INKURA_CLIENT_WARN_MS`: threshold warning untuk metrik browser lambat (poll/upload)
- `INKURA_LOG_QUERIES=1`: log query Prisma umum, bukan hanya slow query. Biasanya cukup dipakai sementara saat investigasi.

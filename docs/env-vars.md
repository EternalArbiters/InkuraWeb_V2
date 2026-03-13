# Env vars reference

This document is sumber kebenaran env vars for repo Inkura cleaned stage 10.

File example used developer:

```bash
cp apps/web/.env.example apps/web/.env.local
```

## Prinsip general

- `DATABASE_URL` used for runtime Prisma
- `DIRECT_URL` used for migration Prisma
- `NEXTAUTH_URL` must point to origin public that benar
- Upload butuh konfigurasi R2 that valid
- Password reset email butuh Resend if want benar-benar kirim email
- For local, several env may dummy or dileave blank seold features related not used

## Env required

### Database

```env
DATABASE_URL=
DIRECT_URL=
```

- `DATABASE_URL`: connection pooled for runtime app
- `DIRECT_URL`: connection direct for migrate / schema operations

### NextAuth

```env
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
```

- `NEXTAUTH_SECRET`: secret acak for session/auth
- `NEXTAUTH_URL`: origin kanonik app, required akurat in production

## Env sangat disarankan for features upload

Repo receives dua style penamaan for R2. Pilih salah satu style, do not dicampur without alasan.

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

Note:

- kode juga receives alias legacy `CLOUDFLARE_R2_*`
- `R2_PUBLIC_BASE_URL` must point to base URL public that benar, misalnya custom domain CDN
- if env upload not complete, presign or preview asset can failed

## Env optional for email and password reset

```env
RESEND_API_KEY=
EMAIL_FROM="Inkura <no-reply@example.com>"
RESET_PASSWORD_URL_BASE=http://localhost:3000
APP_BASE_URL=http://localhost:3000
SHOW_RESET_TOKEN=1
```

Keterangan:

- `RESEND_API_KEY` + `EMAIL_FROM` needed for benar-benar mengirim email reset password
- `RESET_PASSWORD_URL_BASE` diprioritaskan for membentuk link reset password
- `APP_BASE_URL` is fallback additional
- `SHOW_RESET_TOKEN=1` useful for local/dev if not yet menghubungkan email

Important note:

- nama env used backend is **`SHOW_RESET_TOKEN`**, not `NEXT_PUBLIC_SHOW_RESET_TOKEN`

## Env optional for frontend origin fallback

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Diuse as fallback oleh helper server-side `apiJson()` when origin not can dcontentmpulkan from header request.

## Env optional for OAuth

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
```

Leave blank if provider that not used.


## Env optional for throttling / rate limit

```env
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Keterangan:

- used oleh limiter server-side berbasis Upstash Redis
- if dua env this not dicontent, limiter not crash, but automatic bypass sambil mencatat warning
- content nilainya from dashboard database Upstash Redis that you use

## Env optional for observability

```env
INKURA_LOG_LEVEL=info
INKURA_LOG_REQUESTS=
INKURA_SERVICE_NAME=
```

- `INKURA_LOG_LEVEL`: `debug`, `info`, `warn`, or `error`
- `INKURA_LOG_REQUESTS=1`: log all request API, useful for debugging tapi can bercontentk
- `INKURA_SERVICE_NAME`: label service in structured log

## Env optional for deploy preview

```env
INKURA_MIGRATE_PREVIEW=
```

- set `1` only if preview deployment punya database preview that separate and memang may auto-migrate

## Env optional for Playwright smoke

```env
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000
E2E_ADMIN_EMAIL=noelephgoddess.game@gmail.com
E2E_ADMIN_PASSWORD=admin123
```

If not dicontent, smoke test local will uses default that tersedia in seed and konfigurasi Playwright.

## Example minimal for local

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

## Checklist cepat if env terasa salah

- login loop or session odd → check `NEXTAUTH_URL` and `NEXTAUTH_SECRET`
- migration failed → check `DIRECT_URL`
- upload presign failed → check env R2 complete
- image successful upload tapi not tampil → check `R2_PUBLIC_BASE_URL`
- forgot password not kirim email → check `RESEND_API_KEY` and `EMAIL_FROM`

## Env optional for metrik performa Stage F

```env
INKURA_SLOW_ROUTE_MS=600
INKURA_SLOW_PAGE_RENDER_MS=900
INKURA_SLOW_QUERY_MS=250
INKURA_CLIENT_WARN_MS=4000
INKURA_LOG_QUERIES=
```

Keterangan:

- `INKURA_SLOW_ROUTE_MS`: threshold warning for API route lambat
- `INKURA_SLOW_PAGE_RENDER_MS`: threshold warning for server page render lambat
- `INKURA_SLOW_QUERY_MS`: threshold warning for query Prisma lambat
- `INKURA_CLIENT_WARN_MS`: threshold warning for metrik browser lambat (poll/upload)
- `INKURA_LOG_QUERIES=1`: log query Prisma general, not only slow query. Biasanya enough used sementara when investigasi.

# Inkura_cleaned — Stage 10 Final Snapshot

Snapshot ini adalah versi **paling lengkap dan utuh** dari repo hasil perapian bertahap **stage 0 sampai stage 10**.

Tujuan utamanya tetap sama sejak awal: **repo makin rapi tanpa menghilangkan fitur**. Semua tahap sebelumnya sudah terakumulasi di snapshot ini, jadi stage 10 adalah titik referensi final untuk kerja lanjut, audit, handoff, atau baseline refactor berikutnya.

## Ringkasnya, repo ini sekarang seperti apa

- Runtime app tinggal **satu**: `apps/web`
- Stack utama: **Next.js App Router + NextAuth + Prisma + Neon Postgres + Cloudflare R2**
- API route hidup di `apps/web/app/api/*`
- Business logic server dipusatkan ke `apps/web/server/*`
- Upload file memakai **presigned upload ke R2**, bukan filesystem lokal
- Repo memakai **npm + npm workspaces**
- Tahap safety net, struktur, style, boundary, helper API, services, UI split, data access, observability, test automation, dan dokumentasi final sudah masuk semua

## Cakupan stage 0–10 dalam snapshot ini

- **Stage 0** — safety net, env example, regression checklist, verify baseline
- **Stage 1** — repo/tooling hygiene dan penegasan npm workspace
- **Stage 2** — Prettier, ESLint, conventions dasar
- **Stage 3** — boundary server vs client dipertegas
- **Stage 4** — helper layer untuk route handler API
- **Stage 5** — business logic dipindah ke service layer
- **Stage 6 / 6b / 6c** — pemecahan file UI besar menjadi modul kecil dan hooks
- **Stage 7** — selector/pagination/index hygiene untuk data access
- **Stage 8** — observability, request id, error boundary
- **Stage 9** — unit tests dan smoke E2E scaffold
- **Stage 10** — dokumentasi final, runbook operasional, onboarding, dan panduan debugging

## Struktur repo

```text
.
├─ apps/
│  └─ web/
│     ├─ app/                 # UI routes + API routes
│     ├─ components/          # reusable components lintas page
│     ├─ hooks/               # reusable hooks
│     ├─ lib/                 # pure/shared helpers
│     ├─ prisma/              # schema, migrations, seed
│     ├─ server/              # server-only code
│     ├─ tests/               # Vitest + Playwright
│     └─ docs/                # catatan legacy V15 yang masih relevan
├─ docs/                      # docs kerja & runbook final repo cleaned
├─ package.json               # root workspace scripts
└─ package-lock.json          # source of truth dependency tree
```

## Arsitektur singkat

### App runtime

`apps/web` adalah satu-satunya app yang dipakai untuk dev dan deploy. Di dalamnya:

- `app/**` menangani UI routes dan API routes Next.js
- `server/**` menangani auth server, Prisma, services, storage R2, observability, dan HTTP helpers
- `lib/**` dipakai untuk util yang aman dipakai lintas sisi, atau client helper yang eksplisit

### Server vs client

- Semua yang menyentuh **DB, session, bcrypt, email, storage, headers, cookies** harus tinggal di `server/**` atau `app/api/**`
- Modul sensitif memakai marker `server-only`
- Helper browser-only memakai `client-only`

### Upload

- Cover dan comic pages memakai flow **presign → upload langsung ke R2 → commit / persist ke DB**
- Comment media memakai flow serupa, dengan **SHA-256 dedupe** untuk menghindari object duplikat

### Testing

- Unit tests: **Vitest**
- Smoke E2E: **Playwright**

## Quick start lokal

### 1) Install dependency

```bash
npm install
```

### 2) Siapkan env

Copy file contoh:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Isi minimal:

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `R2_ENDPOINT` atau `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET` atau `R2_BUCKET_NAME`
- `R2_PUBLIC_BASE_URL`

Dokumen lengkap env vars ada di `docs/env-vars.md`.

### 3) Init database lokal

```bash
npm run db:init
```

Perintah ini akan generate Prisma Client, reset schema lokal, lalu menjalankan seed.

### 4) Jalankan app

```bash
npm run dev
```

Default URL lokal:

- `http://localhost:3000`

### 5) Jalankan gate otomatis

```bash
npm run verify
npm run refactor:stage0
```

State saat ini, `verify` menjalankan:

- `prisma validate`
- `prisma generate`
- `tsc --noEmit`
- `vitest run`
- `next build`

### 6) Jalankan test tambahan bila diperlukan

```bash
npm run test:unit
npm run test:e2e
npm run test:smoke
```

Untuk browser Playwright lokal pertama kali:

```bash
npm run test:e2e:install
```

## Seed default lokal

Seed bawaan membuat admin default berikut:

- Email: `noelephgoddess.game@gmail.com`
- Password: `admin123`

Catatan penting:

- Role admin di repo ini di-*enforce* berdasarkan email tersebut
- Jangan pakai kredensial ini apa adanya untuk environment publik

## Perintah kerja yang paling sering dipakai

Dari root repo:

```bash
npm run dev
npm run verify
npm run check
npm run lint
npm run format
npm run db:init
npm run sanity:db
npm run test:unit
npm run test:e2e
```

## Dokumen yang perlu dibaca dulu

Mulai dari sini:

1. `docs/perf-refactor-stage-00-baseline.md`
   - guardrails refactor performa bertahap
   - baseline hotspot untuk tahap 1 dan seterusnya

2. `docs/perf-refactor-stage-07-hydration-preload.md`
   - hasil tahap 7
   - preload review/comment di work detail dan reader + cleanup dynamic wrapper

3. `docs/perf-refactor-stage-06-creator-admin.md`
   - hasil tahap 6
   - penutupan sisa self-fetch server page di studio/admin

4. `docs/perf-refactor-stage-05-public-detail.md`
   - hasil tahap 5
   - pengurangan self-fetch di work detail, reader, reading list, dan redirect legacy

5. `docs/perf-refactor-stage-04-query-dedupe.md`
   - hasil tahap 4
   - dedupe lookup viewer/session + batching interaction untuk home rail

6. `docs/perf-refactor-stage-03-background-auth.md`
   - hasil tahap 3
   - polling badge lebih hemat + auth surface user dipindah dari middleware ke page server

7. `docs/perf-refactor-stage-02-render-cache.md`
   - hasil tahap 2
   - scope dynamic lebih sempit + cache publik taxonomy

8. `docs/README.md`
9. `docs/REGRESSION_CHECKLIST.md`
10. `docs/stage-10-documentation-runbook.md`
11. `docs/env-vars.md`
12. `docs/deployment-runbook.md`
13. `docs/database-reset-and-seeding.md`
14. `docs/debug-upload-issues.md`

## Deploy singkat

Target deploy utama repo ini adalah:

- **Vercel** untuk app runtime
- **Neon Postgres** untuk database
- **Cloudflare R2** untuk asset upload

Ringkasan deploy:

- Root Directory boleh repo root atau `apps/web`
- Build pipeline memakai `vercel-build`
- Production akan menjalankan `prisma migrate deploy`
- Preview **tidak** auto-migrate kecuali `INKURA_MIGRATE_PREVIEW=1`

Panduan deploy lengkap ada di `docs/deployment-runbook.md`.

## Operasional & debugging

Kalau ada masalah yang paling umum:

- masalah env / auth / origin → `docs/env-vars.md`
- masalah deploy Vercel / Neon / migrate → `docs/deployment-runbook.md`
- masalah reset DB / seed / sanity check → `docs/database-reset-and-seeding.md`
- masalah upload presign / R2 / commit media → `docs/debug-upload-issues.md`

## Guardrails yang tetap wajib dijaga

- Jangan campur package manager lain; repo ini pakai **npm**
- Jangan pindahkan server-only code ke komponen client
- Jangan ubah behavior fitur tanpa lewat regression checklist
- Semua refactor signifikan harus lolos `npm run verify`
- Untuk perubahan sensitif, cek juga `docs/REGRESSION_CHECKLIST.md`

## Catatan akhir

Stage 10 dimaksudkan sebagai **snapshot final dokumentasi dan runbook**. Jadi kalau perlu melanjutkan pekerjaan setelah repo ini, baseline yang dipakai sebaiknya adalah snapshot ini, bukan stage sebelumnya.

- Stage 8: `docs/perf-refactor-stage-08-final-hardening.md`


## Refactor audit

- `npm run refactor:stage0` — baseline hotspot scanner
- `npm run refactor:stage8` — final audit guardrail

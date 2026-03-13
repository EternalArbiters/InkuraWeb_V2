# Inkura_cleaned — Stage 10 Final Snapshot

Snapshot this is versi **most complete and utuh** from repo hasil perapian bertahap **stage 0 sampai stage 10**.

The goal of this effort still same since initial: **repo more tidy without removing features**. All stage previously already accumulated in snapshot this, become stage 10 is point referensi final for work continue, audit, handoff, or baseline refactor next.

## Ringkasnya, repo this now seperti apa

- Runtime app stay **satu**: `apps/web`
- Stack main: **Next.js App Router + NextAuth + Prisma + Neon Postgres + Cloudflare R2**
- API route hidup in `apps/web/app/api/*`
- Business logic server dipusatkan to `apps/web/server/*`
- Upload file uses **presigned upload to R2**, not filesystem local
- Repo uses **npm + npm workspaces**
- Stage safety net, structure, style, boundary, helper API, services, UI split, data access, observability, test automation, and dokumentasi final already enter all

## Cakupan stage 0–10 dalam snapshot this

- **Stage 0** — safety net, env example, regression checklist, verify baseline
- **Stage 1** — repo/tooling hygiene and penegasan npm workspace
- **Stage 2** — Prettier, ESLint, conventions basic
- **Stage 3** — boundary server vs client dipertegas
- **Stage 4** — helper layer for route handler API
- **Stage 5** — business logic moved to service layer
- **Stage 6 / 6b / 6c** — splitting large UI files into small modules and hooks
- **Stage 7** — selector/pagination/index hygiene for data access
- **Stage 8** — observability, request id, error boundary
- **Stage 9** — unit tests and smoke E2E scaffold
- **Stage 10** — dokumentasi final, runbook operasional, onboarding, and panduan debugging

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
│     └─ docs/                # legacy notes V15 that still relevant
├─ docs/                      # docs kerja & runbook final repo cleaned
├─ package.json               # root workspace scripts
└─ package-lock.json          # source of truth dependency tree
```

## Arsitektur singkat

### App runtime

`apps/web` is satu-satunya app that used for dev and deploy. Di dalamnya:

- `app/**` menangani UI routes and API routes Next.js
- `server/**` menangani auth server, Prisma, services, storage R2, observability, and HTTP helpers
- `lib/**` used for util safe used lintas scontent, or client helper that eksplcontentt

### Server vs client

- All that touch **DB, session, bcrypt, email, storage, headers, cookies** must stay in `server/**` or `app/api/**`
- Modul sensitif uses marker `server-only`
- Helper browser-only uses `client-only`

### Upload

- Cover and comic pages uses flow **presign → upload directly to R2 → commit / persist to DB**
- Comment media uses flow similar, with **SHA-256 dedupe** to avoid object duplicate

### Testing

- Unit tests: **Vitest**
- Smoke E2E: **Playwright**

## Quick start local

### 1) Install dependency

```bash
npm install
```

### 2) Siapkan env

Copy file example:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Minimum contents:

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `R2_ENDPOINT` or `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET` or `R2_BUCKET_NAME`
- `R2_PUBLIC_BASE_URL`

Complete env var documentation is in `docs/env-vars.md`.

### 3) Init database local

```bash
npm run db:init
```

Perintah this will generate Prisma Client, reset schema local, then menjalankan seed.

### 4) Jalankan app

```bash
npm run dev
```

Default URL local:

- `http://localhost:3000`

### 5) Jalankan gate automatic

```bash
npm run verify
npm run refactor:stage0
```

State currently, `verify` menjalankan:

- `prisma validate`
- `prisma generate`
- `tsc --noEmit`
- `vitest run`
- `next build`

### 6) Jalankan test additional if diperlukan

```bash
npm run test:unit
npm run test:e2e
npm run test:smoke
```

For browser Playwright local pertama kali:

```bash
npm run test:e2e:install
```

## Seed default local

Seed default make admin default following:

- Email: `noelephgoddess.game@gmail.com`
- Password: `admin123`

Important note:

- Role admin in repo this in-*enforce* berdasarkan email that
- Do not use kredensial this apa aandya for environment public

## Perintah work that most often used

From root repo:

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

## Documents that should be read first

Mulai from here:

1. `docs/perf-refactor-stage-00-baseline.md`
   - guardrails refactor performa bertahap
   - baseline hotspot for stage 1 and seterusnya

2. `docs/perf-refactor-stage-07-hydration-preload.md`
   - hasil stage 7
   - preload review/comment in work detail and reader + cleanup dynamic wrapper

3. `docs/perf-refactor-stage-06-creator-admin.md`
   - hasil stage 6
   - closing the remaining self-fetch server page in studio/admin

4. `docs/perf-refactor-stage-05-public-detail.md`
   - hasil stage 5
   - pengurangan self-fetch in work detail, reader, reading list, and redirect legacy

5. `docs/perf-refactor-stage-04-query-dedupe.md`
   - hasil stage 4
   - dedupe lookup viewer/session + batching interaction for home rail

6. `docs/perf-refactor-stage-03-background-auth.md`
   - hasil stage 3
   - polling badge more hemat + auth surface user moved from middleware to page server

7. `docs/perf-refactor-stage-02-render-cache.md`
   - hasil stage 2
   - scope dynamic more sempit + cache public taxonomy

8. `docs/README.md`
9. `docs/REGRESSION_CHECKLIST.md`
10. `docs/stage-10-documentation-runbook.md`
11. `docs/env-vars.md`
12. `docs/deployment-runbook.md`
13. `docs/database-reset-and-seeding.md`
14. `docs/debug-upload-issues.md`

## Deploy singkat

Target deploy main repo this is:

- **Vercel** for app runtime
- **Neon Postgres** for database
- **Cloudflare R2** for asset upload

Ringkasan deploy:

- Root Directory may repo root or `apps/web`
- Build pipeline uses `vercel-build`
- Production will menjalankan `prisma migrate deploy`
- Preview **not** auto-migrate kecuali `INKURA_MIGRATE_PREVIEW=1`

Panduan deploy complete there is in `docs/deployment-runbook.md`.

## Operasional & debugging

If there is issue that most general:

- issue env / auth / origin → `docs/env-vars.md`
- issue deploy Vercel / Neon / migrate → `docs/deployment-runbook.md`
- issue reset DB / seed / sanity check → `docs/database-reset-and-seeding.md`
- issue upload presign / R2 / commit media → `docs/debug-upload-issues.md`

## Guardrails that still required preserved

- Do not campur package manager lain; repo this use **npm**
- Do not pindahkan server-only code to komponen client
- Do not change behavior features without through regression checklist
- All refactor signifikan must pass `npm run verify`
- For perubahan sensitif, check juga `docs/REGRESSION_CHECKLIST.md`

## Final note

Stage 10 dimaksudkan as **snapshot final dokumentasi and runbook**. Jadi if need continue pekerjaan after repo this, baseline used should is snapshot this, not stage previously.

- Stage 8: `docs/perf-refactor-stage-08-final-hardening.md`


## Refactor audit

- `npm run refactor:stage0` — baseline hotspot scanner
- `npm run refactor:stage8` — final audit guardrail

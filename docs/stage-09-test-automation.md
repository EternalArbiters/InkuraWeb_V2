# Stage 09 — Test automation

The goal of this stage: menambah safety net automatic without changing behavior produk. Fokusnya **critical-path automation** that most realistis for repo hasil stage 0–8.

## What was added

### 1) Unit tests (Vitest)

Target unit test selected from helper/service already enough pure after stage 3–8:

- **works gating**
  - mature gate
  - deviant-love gate
  - chapter gate
- **comment tree builder**
  - alias sort
  - tree nesting + orphan root
  - pinned-first ordering
- **notification helpers**
  - mention extraction
  - dedupe key stability
  - gated recipient checks
- **upload presign rules**
  - scope normalization
  - content-type rules
  - sha256 + deterministic key generation

Current suite = **12 unit tests** in `apps/web/tests/unit`.

### 2) Smoke E2E (Playwright)

Stage this juga menambah smoke suite minimal in `apps/web/tests/e2e` for flow that most penting and most dekat with checklist manual:

- auth → browse → read → comment + reply
- studio → create work
- admin → taxonomy create + search

Note: E2E diasumsikan berjalan terhadap **env local that valid** and **database already in-seed**.

## Scripts

From root repo:

```bash
npm run test:unit
npm run test:e2e
npm run test:smoke
```

From `apps/web`:

```bash
npm run test:unit
npm run test:e2e
npm run test:e2e:install
```

## Prasyarat E2E local

1. Install dependencies

```bash
npm install
```

2. Install browser Playwright

```bash
npm run test:e2e:install
```

3. Siapkan env local

- copy `apps/web/.env.example` → `apps/web/.env.local`
- content `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_*`, `R2_*`, etc

4. Reset + seed DB

```bash
npm --workspace apps/web run db:init
```

5. Jalankan smoke suite

```bash
npm run test:unit
npm run test:e2e
```

## Credential default for smoke local

Seed default repo still used for login smoke:

- email: `noelephgoddess.game@gmail.com`
- password: `admin123`

If want override without changing seed, use env following when menjalankan Playwright:

- `E2E_ADMIN_EMAIL`
- `E2E_ADMIN_PASSWORD`
- `PLAYWRIGHT_BASE_URL` (optional if app already running in URL lain)

## Definition of done

Stage 09 considered complete if:

- unit test can jalan local with `npm run test:unit`
- smoke E2E can run in env local seeded
- `npm run verify` still pass
- perubahan test not mengubah behavior features produksi

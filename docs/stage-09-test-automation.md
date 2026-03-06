# Stage 09 — Test automation

Tujuan stage ini: menambah safety net otomatis tanpa mengubah behavior produk. Fokusnya **critical-path automation** yang paling realistis untuk repo hasil stage 0–8.

## Yang ditambahkan

### 1) Unit tests (Vitest)

Target unit test dipilih dari helper/service yang sudah cukup pure setelah stage 3–8:

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

Current suite = **12 unit tests** di `apps/web/tests/unit`.

### 2) Smoke E2E (Playwright)

Stage ini juga menambah smoke suite minimal di `apps/web/tests/e2e` untuk flow yang paling penting dan paling dekat dengan checklist manual:

- auth → browse → read → comment + reply
- studio → create work
- admin → taxonomy create + search

Catatan: E2E diasumsikan berjalan terhadap **env lokal yang valid** dan **database yang sudah di-seed**.

## Scripts

Dari root repo:

```bash
npm run test:unit
npm run test:e2e
npm run test:smoke
```

Dari `apps/web`:

```bash
npm run test:unit
npm run test:e2e
npm run test:e2e:install
```

## Prasyarat E2E lokal

1. Install dependencies

```bash
npm install
```

2. Install browser Playwright

```bash
npm run test:e2e:install
```

3. Siapkan env lokal

- copy `apps/web/.env.example` → `apps/web/.env.local`
- isi `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_*`, `R2_*`, dst

4. Reset + seed DB

```bash
npm --workspace apps/web run db:init
```

5. Jalankan smoke suite

```bash
npm run test:unit
npm run test:e2e
```

## Credential default untuk smoke lokal

Seed bawaan repo masih dipakai untuk login smoke:

- email: `noelephgoddess.game@gmail.com`
- password: `admin123`

Kalau mau override tanpa mengubah seed, gunakan env berikut saat menjalankan Playwright:

- `E2E_ADMIN_EMAIL`
- `E2E_ADMIN_PASSWORD`
- `PLAYWRIGHT_BASE_URL` (opsional bila app sudah running di URL lain)

## Definition of done

Stage 09 dianggap selesai bila:

- unit test bisa jalan lokal dengan `npm run test:unit`
- smoke E2E bisa dijalankan di env lokal seeded
- `npm run verify` tetap lolos
- perubahan test tidak mengubah behavior fitur produksi

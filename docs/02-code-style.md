# Stage 2: Code Style & Conventions

Tahap ini fokus ke konsistensi gaya kode (formatting + lint) **tanpa mengubah fitur**.

## Perintah yang tersedia

Semua perintah dijalankan dari **root repo**:

- Format semua file yang relevan:
  - `npm run format`

- Cek format (tanpa mengubah file):
  - `npm run format:check`

- Lint (Next.js ESLint):
  - `npm run lint`

- Lint + autofix:
  - `npm run lint:fix`

- Gabungan check yang aman (format-check + lint + typecheck):
  - `npm run check`

> Catatan: `npm run verify` tetap dipertahankan sebagai gate build/typecheck/migrate.
> Lint/format **tidak** dimasukkan ke `verify` agar refactor bertahap tetap nyaman.

## Formatting

- Prettier digunakan sebagai formatter utama.
- `prettier-plugin-tailwindcss` aktif untuk mengurutkan class Tailwind.

Konfigurasi:
- `.prettierrc.json`
- `.prettierignore`

## Linting

- ESLint dikonfigurasi dengan preset Next:
  - `next/core-web-vitals`
  - `next/typescript`

Konfigurasi:
- `apps/web/.eslintrc.cjs`
- `apps/web/.eslintignore`

Tahap ini sengaja **konservatif** (rules minimal) supaya tidak memaksa perbaikan massal.
Rules yang lebih ketat bisa ditambahkan di tahap berikutnya, sedikit demi sedikit.

## Conventions yang dipakai

- Import alias TypeScript sudah tersedia:
  - `@/*` mengarah ke root `apps/web/`

- File server-only sebaiknya berada di `apps/web/server/**`.
- File yang bisa dipakai server+client boleh di `apps/web/lib/**`.


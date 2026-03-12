# Stage 2: Code Style & Conventions

This stage fokus to consistentsi gaya kode (formatting + lint) **without mengubah features**.

## Perintah that tersedia

Semua command dijalankan from **root repo**:

- Format all file that are relevant:
  - `npm run format`

- Cek format (without mengubah file):
  - `npm run format:check`

- Lint (Next.js ESLint):
  - `npm run lint`

- Lint + autofix:
  - `npm run lint:fix`

- Gabungan check safe (format-check + lint + typecheck):
  - `npm run check`

> Note: pada snapshot final stage 10, `npm run verify` used sebagai gate build/typecheck/test and **still not** meenterkan lint/format.
> Jadi lint/format still dijalankan terpisah through `npm run check`, `npm run lint`, or `npm run format:check`.

## Formatting

- Prettier digunakan sebagai formatter main.
- `prettier-plugin-tailwindcss` active for mengurutkan class Tailwind.

Konfigurasi:
- `.prettierrc.json`
- `.prettierignore`

## Linting

- ESLint dikonfigurasi with preset Next:
  - `next/core-web-vitals`
  - `next/typescript`

Konfigurasi:
- `apps/web/.eslintrc.cjs`
- `apps/web/.eslintignore`

This stage intentionally **konservatif** (rules minimal) so that not memaksa perbaikan massal.
Rules that more ketat can ditambahkan in stage berikutnya, sedikit demi sedikit.

## Conventions used

- Import alias TypeScript already tersedia:
  - `@/*` mengarah to root `apps/web/`

- File server-only should berada in `apps/web/server/**`.
- File that can used server+client may in `apps/web/lib/**`.


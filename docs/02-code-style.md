# Stage 2: Code Style & Conventions

This stage focuses on to consistentsi gaya kode (formatting + lint) **without changing features**.

## Perintah that tersedia

All command run from **root repo**:

- Format all file that are relevant:
  - `npm run format`

- Cek format (without changing file):
  - `npm run format:check`

- Lint (Next.js ESLint):
  - `npm run lint`

- Lint + autofix:
  - `npm run lint:fix`

- Gabungan check safe (format-check + lint + typecheck):
  - `npm run check`

> Note: on snapshot final stage 10, `npm run verify` used as gate build/typecheck/test and **still not** meenterkan lint/format.
> Jadi lint/format still run separate through `npm run check`, `npm run lint`, or `npm run format:check`.

## Formatting

- Prettier used as formatter main.
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
Rules that more ketat can added in stage next, few demi few.

## Conventions used

- Import alias TypeScript already tersedia:
  - `@/*` mengarah to root `apps/web/`

- File server-only should berada in `apps/web/server/**`.
- File that can used server+client may in `apps/web/lib/**`.


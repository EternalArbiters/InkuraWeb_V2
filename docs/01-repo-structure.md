# Repo structure & tooling (Stage 1)

The purpose of this document: explain the current Inkura repo structure (v13+) so it stays consistent, easy to understand, and does not make new developers feel lost.

## Package manager

This repo uses **npm** and **npm workspaces**.

- Lockfile sumber kebenaran: `package-lock.json` (in root)
- Workspace main: `apps/web`

> Note: file konfigurasi pnpm (`pnpm-workspace.yaml`) **has already been removed** so that not there is mixed signals.

### Command that biasa used

From the repo root:

```bash
npm install
npm run dev
npm run verify
```

Or run directly in the app:

```bash
cd apps/web
npm install
npm run dev
npm run verify
```

## Folder layout

In this repo only there is **1 aplikasi runtime**:

- `apps/web/` — Next.js app (App Router)
  - `app/` — routes UI + API (`app/api/*`)
  - `server/` — modul server-only (Prisma, R2, notifications, dll)
  - `prisma/` — schema, migrations, seed
  - `components/` — komponen UI reusable (shadcn-like)
  - `hooks/` — custom React hooks
  - `lib/` — helpers general (avoid server-only in sini)

Repo-level:

- `docs/` — working/refactor documents (stage roadmap, checklist)
- `README.md` — feature overview and setup

## Env files

Example env file:

- `apps/web/.env.example`

How to use it locally:

```bash
cp apps/web/.env.example apps/web/.env.local
```

> Do not commit `.env.local` or file env that bercontent secrets.

## Boundary principles (server vs client)

- Apa pun that menyentuh DB / credentials / storage must tinggal in `apps/web/server/*` or `apps/web/app/api/*`.
- Modul server-only should memasang marker `server-only` to prevent kebawa to client.

Full boundary rules are documented in `03-server-client-boundary.md`.

## Definition of done – Stage 1

Stage 1 is considered complete if:

- Repo cuma memberikan sinyal **1 toolchain** (npm) and not there is config ganda that membingungkan.
- Struktur folder + document “entry point” clear.
- `npm run verify` still pass (without change behavior features).

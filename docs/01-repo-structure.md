# Repo structure & tooling (Stage 1)

Tujuan dokumen ini: menjelaskan struktur repo Inkura yang sekarang (v13+) supaya konsisten, gampang dipahami, dan nggak bikin dev baru “nyasar”.

## Package manager

Repo ini memakai **npm** dan **npm workspaces**.

- Lockfile sumber kebenaran: `package-lock.json` (di root)
- Workspace utama: `apps/web`

> Catatan: file konfigurasi pnpm (`pnpm-workspace.yaml`) **sudah dihapus** supaya tidak ada sinyal ganda.

### Command yang biasa dipakai

Dari root:

```bash
npm install
npm run dev
npm run verify
```

Atau langsung di app:

```bash
cd apps/web
npm install
npm run dev
npm run verify
```

## Layout folder

Di repo ini hanya ada **1 aplikasi runtime**:

- `apps/web/` — Next.js app (App Router)
  - `app/` — routes UI + API (`app/api/*`)
  - `server/` — modul server-only (Prisma, R2, notifications, dll)
  - `prisma/` — schema, migrations, seed
  - `components/` — komponen UI reusable (shadcn-like)
  - `hooks/` — custom React hooks
  - `lib/` — helpers umum (hindari server-only di sini)

Repo-level:

- `docs/` — dokumen kerja/refactor (stage roadmap, checklist)
- `README.md` — overview fitur & setup

## Env files

Contoh env ada di:

- `apps/web/.env.example`

Cara pakai lokal:

```bash
cp apps/web/.env.example apps/web/.env.local
```

> Jangan commit `.env.local` atau file env yang berisi secrets.

## Prinsip boundary (server vs client)

- Apa pun yang menyentuh DB / credentials / storage harus tinggal di `apps/web/server/*` atau `apps/web/app/api/*`.
- Modul server-only sebaiknya memasang marker `server-only` untuk mencegah kebawa ke client.

## Definition of done – Stage 1

Stage 1 dianggap selesai jika:

- Repo cuma memberikan sinyal **1 toolchain** (npm) dan tidak ada config ganda yang membingungkan.
- Struktur folder + dokumen “entry point” jelas.
- `npm run verify` tetap lulus (tanpa ubah behavior fitur).

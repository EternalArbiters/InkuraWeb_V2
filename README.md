# Inkura v13 (Vercel + Neon + Cloudflare R2 + optional Resend)

Target stack & biaya (umumnya):
- **Vercel Hobby**: $0 (ada limit ketat)
- **Neon Free (Postgres)**: $0
- **Cloudflare R2**: bisa $0 kalau masih dalam free quota
- **Resend Free (email)**: $0 (opsional)
- **Total**: seringnya **$0 – $5**

> v13 fokus: **Auth stabil** + **1 deployment saja** (web + API + NextAuth dalam satu Next.js app) + **upload file langsung ke R2** (hemat Vercel).

---

## Perubahan utama v13 (dibanding v11/v12 monorepo 2-backend)

### 1) Single deployment (FIX: login sering "logout" / session nggak kebaca)
- **Semua API route dipindah ke `apps/web/app/api/*`**
- **Hapus proxy rewrite `/api/*` ke backend lain**
- NextAuth + middleware + API sekarang **satu origin** → cookie/session jauh lebih stabil

### 2) "Server-only" dipisah jelas
- Semua yang rahasia (DB, R2 keys, admin actions) ada di sisi server:
  - `apps/web/server/*` dan `apps/web/app/api/*`
- Modul server diberi `import "server-only"` supaya kalau ke-import client langsung error.

### 3) Upload production-ready (tanpa filesystem Vercel)
- Upload **tidak lagi** ke `public/uploads`.
- Upload memakai **Cloudflare R2**:
  - **Presigned URL**: client upload langsung ke R2
  - Server hanya membuat presign + validasi ownership

### 4) RBAC + Ownership (Batoto-like)
- **USER**: create/edit/delete **punya sendiri**
- **ADMIN**: bisa edit/delete **semua**
- Enforcement ada di endpoint mutasi (server), bukan cuma di UI.

### 5) DB tambahan untuk R2 keys
- `Work.coverKey` (opsional)
- `ComicPage.imageKey` (opsional)

Tujuan: saat delete/replace asset, server bisa delete object R2 dengan aman.

---

## Status implementasi (DONE)

- [x] NextAuth handler di `apps/web/app/api/auth/[...nextauth]`
- [x] Hapus proxy `/api/*` (single-origin)
- [x] Cloudflare R2 adapter (`apps/web/server/storage/r2.ts`)
- [x] Endpoint presign: `POST /api/uploads/presign`
- [x] Frontend cover edit menggunakan presign upload (WorkEditForm)
- [x] Frontend comic pages manager menggunakan presign upload (ComicPagesManager)
- [x] **Create chapter** (COMIC) bisa upload pages saat create (flow 2-step: create chapter → presign upload → commit pages)
- [x] Endpoint commit pages: `POST /api/studio/chapters/[chapterId]/pages`
- [x] Endpoint delete page: delete DB + best-effort delete object R2 via `imageKey`
- [x] Permission checks (owner/admin) untuk route studio penting

---

## TODO / opsional (disiapkan di README, bisa dilanjutkan)

> Ini sengaja ditulis sebagai checklist biar kamu bisa lanjut bertahap tanpa ngulang desain.

### Resend (email) — opsional
- [x] Forgot password + reset token (endpoint + UI + Resend best-effort)
- [ ] Verify email (kalau perlu)

### Optimasi biaya & kuota (recommended)
- [ ] Batasi ukuran upload (cover ~2MB, page ~5MB)
- [ ] Kompres cover/pages (client-side) sebelum upload
- [ ] Pagination untuk list (works/chapters/comments) biar query Neon ringan
- [ ] Pakai custom domain / CDN untuk R2 (supaya bandwidth nggak lewat Vercel)

### Moderation/Audit (opsional)
- [ ] AuditLog untuk aksi admin
- [ ] Report queue (minimal)

---

## Struktur repo (yang dipakai v13)

- `apps/web` → **utama** (deploy ke Vercel)
  - `app/` → pages + API routes
  - `server/` → server-only services (R2, dll)
  - `prisma/` → schema + migrations + seed

> Folder `apps/api` (legacy) **sudah dihapus** di versi repo yang dirapikan ini. v13 memang **tidak membutuhkan** deploy backend terpisah.

---

---

## Tooling & struktur repo

Repo ini memakai **npm + npm workspaces** (lockfile: `package-lock.json`).

- App runtime hanya ada di: `apps/web`
- Dokumen stage/guard ada di: `docs/` (mulai dari `docs/README.md`)


## Setup lokal

### 1) Install

```bash
npm install
```

### 2) ENV

Copy:
- `apps/web/.env.example` → `apps/web/.env.local`

Isi minimal:
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `DATABASE_URL` (Neon pooled)
- `DIRECT_URL` (Neon direct)
- `R2_*`

### 3) Init DB

```bash
npm --workspace apps/web run db:init
```

### 4) Run dev

```bash
npm run dev
```

Web: http://localhost:3000

**Seed default admin (dev):**
- Email: `noelephgoddess.game@gmail.com`
- Password: `admin123`

> Catatan: di versi ini, role **ADMIN** di-*enforce* berdasarkan email (lihat `apps/web/server/auth/adminEmail.ts`).

### 5) Verify (recommended sebelum/ sesudah perubahan besar)

```bash
npm run verify
```

Checklist regresi manual:
- `docs/REGRESSION_CHECKLIST.md`

---

## Deploy ke Vercel (Hobby)

Buat **1 project**:
- Root Directory: `apps/web`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output: default Next.js

Set Env Vars (Production + Preview):
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `DATABASE_URL`
- `DIRECT_URL`
- `R2_ENDPOINT`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `R2_PUBLIC_BASE_URL`

---

## Catatan penting keamanan

- UI boleh menyembunyikan tombol, tapi **keamanan wajib** di server.
- Semua endpoint mutasi harus cek:
  - `ADMIN` **atau** owner (authorId)
- Presign upload juga harus cek ownership work/chapter.


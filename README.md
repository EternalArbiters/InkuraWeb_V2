# Inkura v11 (Monorepo)

Struktur:
- `apps/web` → Frontend (Next.js App Router)
- `apps/api` → Backend API (Next.js App Router + Prisma + NextAuth)

Web melakukan proxy:
- `/api/*` → `apps/api`
- `/uploads/*` → `apps/api`

> Target deploy yang disiapkan: **Vercel 2 project** (web + api), **Neon Postgres**, dan (opsional) **Cloudflare R2** untuk file/halaman komik.

---

## 1) Setup Database (Neon Postgres)

1. Buat project di Neon (region Singapore recommended).
2. Buka **Connect** di Neon.
3. Copy **dua URL**:
   - **Pooled** (Connection pooling = ON) → untuk runtime
   - **Direct** (Connection pooling = OFF) → untuk Prisma (db push/migrate/seed)

Gunakan format env ini:
- `DATABASE_URL` = pooled URL
- `DIRECT_URL` = direct URL

---

## 2) Setup ENV (lokal)

Salin file contoh:
- `apps/api/.env.example` → `apps/api/.env`
- `apps/web/.env.example` → `apps/web/.env`

Isi minimal:
- `DATABASE_URL`
- `DIRECT_URL`
- `NEXTAUTH_SECRET`
- `INTERNAL_API_BASE` (untuk web)

Generate `NEXTAUTH_SECRET` (PowerShell):
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> Pastikan `NEXTAUTH_SECRET` di `apps/web` **sama** dengan di `apps/api`.

---

## 3) Init database schema + seed (lokal)

```bash
npm install
npm run db:init
```

Script ini menjalankan Prisma generate + reset schema + seed dari workspace `apps/api`.

---

## 4) Jalankan dev server

```bash
npm run dev
```

- Web: http://localhost:3000
- API: http://localhost:3001

---

## 5) Deploy ke Vercel (2 project)

### A. Project API
- Root Directory: `apps/api`
- Env (Production + Preview):
  - `DATABASE_URL` (pooled)
  - `DIRECT_URL` (direct)
  - `NEXTAUTH_SECRET`
  - (opsional) OAuth provider keys

### B. Project WEB
- Root Directory: `apps/web`
- Env (Production + Preview):
  - `INTERNAL_API_BASE` = URL project API (contoh: `https://<api>.vercel.app`)
  - `DATABASE_URL` (pooled)
  - `DIRECT_URL` (direct)
  - `NEXTAUTH_SECRET` (sama dengan API)

---

## Catatan penting

### Upload masih lokal (belum R2)
Saat ini upload masih ke filesystem `public/uploads` di `apps/api`.
Di Vercel, filesystem **tidak persisten** (file bisa hilang).
Kalau mau production-ready, versi berikutnya akan memindahkan upload ke **Cloudflare R2**.

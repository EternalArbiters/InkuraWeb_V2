# Stage 10 — Dokumentasi & Runbook final

Tujuan stage 10 adalah menutup rangkaian perapian dengan membuat repo ini **mudah dioperasikan oleh developer baru** tanpa perlu menebak-nebak struktur, env, deploy flow, atau cara debug masalah umum.

Stage ini tidak menambah fitur produk. Fokusnya adalah:

- README root yang benar-benar mencerminkan state repo saat ini
- dokumentasi env vars yang lengkap dan konsisten
- deployment runbook untuk Vercel + Neon + R2
- panduan reset database, seeding, dan sanity check
- panduan debug upload issues

## Yang diselesaikan di stage 10

### 1) README final repo

README root sekarang berfungsi sebagai entry point utama untuk:

- mengenali arsitektur repo
- setup lokal cepat
- command penting
- daftar dokumen yang perlu dibaca

### 2) Sumber kebenaran env vars

Dokumen `env-vars.md` dan `apps/web/.env.example` disejajarkan dengan pemakaian env aktual di kode, termasuk:

- NextAuth
- Neon/Postgres
- Cloudflare R2
- Resend / password reset
- observability
- Playwright smoke env

### 3) Runbook deploy

Deploy sekarang terdokumentasi dari sudut pandang operasional:

- env wajib
- pilihan root directory Vercel
- behavior `vercel-build`
- kapan migrate dijalankan
- checklist sesudah deploy

### 4) Runbook database lokal

Developer baru sekarang punya satu dokumen untuk:

- reset database lokal dengan aman
- seed data awal
- menjalankan sanity check
- membedakan perintah lokal vs production

### 5) Runbook upload debugging

Masalah upload adalah salah satu area yang paling sering membingungkan. Stage 10 menutup gap itu dengan panduan yang menjelaskan:

- urutan flow presign → upload → commit
- jenis error yang umum
- size/type rules
- env mana yang biasanya jadi sumber masalah
- cara memakai `x-request-id` untuk melacak error di log

## Alur onboarding yang direkomendasikan

Untuk developer baru, urutan paling aman adalah:

1. baca `README.md`
2. copy `apps/web/.env.example` menjadi `.env.local`
3. jalankan `npm install`
4. jalankan `npm run db:init`
5. jalankan `npm run dev`
6. jalankan `npm run verify`
7. cek `REGRESSION_CHECKLIST.md` sebelum perubahan besar

## Definition of Done stage 10

Stage 10 dianggap selesai bila:

- developer baru bisa menjalankan repo dari nol tanpa bertanya file mana yang harus dibuka dulu
- env yang dipakai kode tercermin di dokumen dan `.env.example`
- deploy flow ke Vercel/Neon/R2 terdokumentasi jelas
- reset DB, seed, dan sanity check punya panduan tersendiri
- masalah upload punya panduan debug yang bisa langsung dipakai

## Catatan

Stage 10 adalah penutup roadmap perapian. Snapshot setelah stage ini seharusnya menjadi baseline paling lengkap untuk pekerjaan berikutnya, karena seluruh perubahan stage 0–10 sudah terakumulasi di sini.

# Stage 10 — Dokumentasi & Runbook final

Tujuan stage 10 adalah menutup rangkaian perapian with membuat repo this **mudah dioperasikan oleh developer new** without perlu menebak-nebak structure, env, deploy flow, or cara debug masalah general.

Stage this not menambah features produk. Fokusnya adalah:

- README root that benar-benar mencerminkan state repo currently
- dokumentasi env vars that lengkap and consistent
- deployment runbook for Vercel + Neon + R2
- panduan reset database, seeding, and sanity check
- panduan debug upload issues

## Yang diselesaikan in stage 10

### 1) README final repo

README root now berfungsi sebagai entry point main for:

- mengenali arsitektur repo
- setup local cepat
- command penting
- list document that perlu dibaca

### 2) Sumber kebenaran env vars

Dokumen `env-vars.md` and `apps/web/.env.example` disejajarkan with pemakaian env aktual in kode, terenter:

- NextAuth
- Neon/Postgres
- Cloudflare R2
- Resend / password reset
- observability
- Playwright smoke env

### 3) Runbook deploy

Deploy now terdokumentasi from sudut panandg operasional:

- required env
- pilihan root directory Vercel
- behavior `vercel-build`
- kapan migrate dijalankan
- checklist sealready deploy

### 4) Runbook database local

Developer new now punya satu document for:

- reset database local with safe
- seed data awal
- menjalankan sanity check
- membedakan command local vs production

### 5) Runbook upload debugging

Masalah upload adalah salah satu area that most sering membingungkan. Stage 10 menutup gap that with panduan that explain:

- urutan flow presign → upload → commit
- jenis error that general
- size/type rules
- env mana that biasanya become sumber masalah
- cara memakai `x-request-id` for melacak error in log

## Alur onboarding that direkomendasikan

For developer new, urutan safest adalah:

1. baca `README.md`
2. copy `apps/web/.env.example` menjadi `.env.local`
3. jalankan `npm install`
4. jalankan `npm run db:init`
5. jalankan `npm run dev`
6. jalankan `npm run verify`
7. check `REGRESSION_CHECKLIST.md` before perubahan besar

## Definition of Done stage 10

Stage 10 dianggap complete if:

- developer new can menjalankan repo from scratch without bertanya file mana that must dibuka first
- env used kode tercermin in document and `.env.example`
- deploy flow to Vercel/Neon/R2 terdokumentasi clear
- reset DB, seed, and sanity check punya panduan tersendiri
- masalah upload punya panduan debug that can directly used

## Catatan

Stage 10 adalah penutup roadmap perapian. Snapshot after stage this semustnya menjadi baseline paling lengkap for pekerjaan berikutnya, because seluruh perubahan stage 0–10 already terakumulasi in sini.

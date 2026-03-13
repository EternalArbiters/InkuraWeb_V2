# Stage 10 — Dokumentasi & Runbook final

The goal of stage 10 is menutup rangkaian perapian with make repo this **easy dioperasikan oleh developer new** without need menebak-nebak structure, env, deploy flow, or cara debug issue general.

Stage this not menambah features produk. Fokusnya is:

- README root that benar-benar mencerminkan state repo currently
- dokumentasi env vars that complete and consistent
- deployment runbook for Vercel + Neon + R2
- panduan reset database, seeding, and sanity check
- panduan debug upload issues

## What was completed in stage 10

### 1) README final repo

README root now functions as entry point main for:

- mengenali arsitektur repo
- setup local cepat
- command penting
- list document that need read

### 2) Sumber kebenaran env vars

The `env-vars.md` document and `apps/web/.env.example` were aligned with the actual env usage in code, including:

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
- when migrate run
- checklist sealready deploy

### 4) Runbook database local

Developer new now punya satu document for:

- reset database local with safe
- seed data initial
- menjalankan sanity check
- membedakan command local vs production

### 5) Runbook upload debugging

Masalah upload is salah satu area that most often membingungkan. Stage 10 menutup gap that with panduan that explain:

- order flow presign → upload → commit
- jenis error that general
- size/type rules
- env mana that biasanya become sumber issue
- cara uses `x-request-id` for melacak error in log

## Alur onboarding that direkomendasikan

For developer new, order safest is:

1. baca `README.md`
2. copy `apps/web/.env.example` become `.env.local`
3. jalankan `npm install`
4. jalankan `npm run db:init`
5. jalankan `npm run dev`
6. jalankan `npm run verify`
7. check `REGRESSION_CHECKLIST.md` before major changes

## Definition of Done stage 10

Stage 10 considered complete if:

- developer new can menjalankan repo from scratch without bertanya file mana that must opened first
- env used kode tercermin in document and `.env.example`
- deploy flow to Vercel/Neon/R2 terdokumentasi clear
- reset DB, seed, and sanity check punya panduan tersendiri
- issue upload punya panduan debug that can directly used

## Notes

Stage 10 is closing roadmap perapian. Snapshot after stage this should become baseline most complete for pekerjaan next, because entire perubahan stage 0–10 already accumulated in here.

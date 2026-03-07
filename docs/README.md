# Docs index

Folder `docs/` adalah pusat dokumentasi kerja untuk repo cleaned ini. Kalau baru mulai, baca dokumen di bawah dengan urutan ini.

## Start here

0. `perf-refactor-stage-00-baseline.md`
   - guardrails dan baseline refactor performa baru
   - titik awal untuk stage 1+ tanpa mengubah fitur

0b. `perf-refactor-stage-01-fanout.md`
   - hasil refactor tahap 1
   - pengurangan self-fetch server page ke API internal

0c. `perf-refactor-stage-02-render-cache.md`
   - hasil refactor tahap 2
   - penyempitan scope dynamic + cache publik untuk taxonomy

0d. `perf-refactor-stage-03-background-auth.md`
   - hasil refactor tahap 3
   - request background navbar lebih hemat + auth surface dipersempit

0e. `perf-refactor-stage-04-query-dedupe.md`
   - hasil refactor tahap 4
   - dedupe lookup viewer/session + batching interaction untuk home rail

0f. `perf-refactor-stage-05-public-detail.md`
   - hasil refactor tahap 5
   - pengurangan self-fetch di work detail, reader, reading list, dan redirect legacy

0g. `perf-refactor-stage-06-creator-admin.md`
   - hasil refactor tahap 6
   - penutupan sisa self-fetch di surface creator/admin dan admin reports

0h. `perf-refactor-stage-07-hydration-preload.md`
   - hasil refactor tahap 7
   - preload review/comment di detail dan reader + cleanup dynamic wrapper

1. `../README.md`
   - overview repo final stage 0–10
   - quick start lokal
   - command utama dan arsitektur singkat

2. `REGRESSION_CHECKLIST.md`
   - checklist manual untuk memastikan fitur tidak hilang setelah refactor

3. `stage-10-documentation-runbook.md`
   - penutup stage 10
   - panduan onboarding dan definition of done dokumentasi final

## Operasional harian

4. `env-vars.md`
   - sumber kebenaran env vars yang dipakai repo
   - mana yang wajib, mana yang opsional, dan contoh konfigurasi lokal

5. `deployment-runbook.md`
   - deploy ke Vercel + Neon + R2
   - guardrails untuk migration dan post-deploy checks

6. `database-reset-and-seeding.md`
   - reset database lokal
   - seed, sanity check, dan catatan migrasi

7. `debug-upload-issues.md`
   - cara melacak masalah presign upload, R2, commit, ownership, dan public URL

## Riwayat perapian stage 0–9

8. `00-stage0-safety-net.md`
   - safety net awal, verify, dan baseline kerja

9. `01-repo-structure.md`
   - struktur repo dan penegasan npm workspace

10. `02-code-style.md`
    - formatting, lint, dan conventions dasar

11. `03-server-client-boundary.md`
    - aturan boundary server vs client

12. `04-api-route-helpers.md`
    - helper layer untuk route handlers API

13. `stage-05-services.md`
    - service layer dan penipisan route handler

14. `stage-06-ui-split.md`
    - pemecahan file UI besar menjadi modul kecil

15. `stage-07-data-access.md`
    - selectors, pagination, dan index hygiene

16. `stage-08-observability.md`
    - structured logging dan error boundary

17. `stage-09-test-automation.md`
    - unit tests dan smoke E2E

## Dokumen legacy yang masih berguna

- `../DEPLOYMENT.md`
  - shortcut deploy singkat
- `../apps/web/docs/V15_DEPLOYMENT_NOTES.md`
  - catatan deploy historis yang masih relevan untuk Vercel/Neon
- `../apps/web/docs/V15_SANITY_CHECKLIST.md`
  - checklist historis khusus patch V15

- Stage 8: `docs/perf-refactor-stage-08-final-hardening.md`

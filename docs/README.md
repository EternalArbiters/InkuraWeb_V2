# Docs index

Folder `docs/` is pusat dokumentasi work for repo cleaned this. If new mulai, baca document in bawah with order this.

## Start here

0. `perf-refactor-stage-00-baseline.md`
   - guardrails and baseline refactor performa new
   - point initial for stage 1+ without changing features

0b. `perf-refactor-stage-01-fanout.md`
   - hasil refactor stage 1
   - pengurangan self-fetch server page to API internal

0c. `perf-refactor-stage-02-render-cache.md`
   - hasil refactor stage 2
   - penyempitan scope dynamic + cache public for taxonomy

0d. `perf-refactor-stage-03-background-auth.md`
   - hasil refactor stage 3
   - request background navbar more hemat + auth surface dipersempit

0e. `perf-refactor-stage-04-query-dedupe.md`
   - hasil refactor stage 4
   - dedupe lookup viewer/session + batching interaction for home rail

0f. `perf-refactor-stage-05-public-detail.md`
   - hasil refactor stage 5
   - pengurangan self-fetch in work detail, reader, reading list, and redirect legacy

0g. `perf-refactor-stage-06-creator-admin.md`
   - hasil refactor stage 6
   - closing the remaining self-fetch in surface creator/admin and admin reports

0h. `perf-refactor-stage-07-hydration-preload.md`
   - hasil refactor stage 7
   - preload review/comment in detail and reader + cleanup dynamic wrapper

1. `../README.md`
   - overview repo final stage 0–10
   - quick start local
   - command main and arsitektur singkat

2. `REGRESSION_CHECKLIST.md`
   - checklist manual to ensure features not lost after refactor

3. `stage-10-documentation-runbook.md`
   - closing stage 10
   - panduan onboarding and definition of done dokumentasi final

## Operasional harian

4. `env-vars.md`
   - sumber kebenaran env vars used repo
   - mana that required, mana that optional, and example konfigurasi local

5. `deployment-runbook.md`
   - deploy to Vercel + Neon + R2
   - guardrails for migration and post-deploy checks

6. `database-reset-and-seeding.md`
   - reset database local
   - seed, sanity check, and note migrasi

7. `debug-upload-issues.md`
   - cara melacak issue presign upload, R2, commit, ownership, and public URL

## Riwayat perapian stage 0–9

8. `00-stage0-safety-net.md`
   - safety net initial, verify, and baseline work

9. `01-repo-structure.md`
   - structure repo and penegasan npm workspace

10. `02-code-style.md`
    - formatting, lint, and conventions basic

11. `03-server-client-boundary.md`
    - rules boundary server vs client

12. `04-api-route-helpers.md`
    - helper layer for route handlers API

13. `stage-05-services.md`
    - service layer and penipisan route handler

14. `stage-06-ui-split.md`
    - splitting large UI files into small modules

15. `stage-07-data-access.md`
    - selectors, pagination, and index hygiene

16. `stage-08-observability.md`
    - structured logging and error boundary

17. `stage-09-test-automation.md`
    - unit tests and smoke E2E

## Legacy documents that are still useful

- `../DEPLOYMENT.md`
  - shortcut deploy singkat
- `../apps/web/docs/V15_DEPLOYMENT_NOTES.md`
  - note deploy historical that still relevant for Vercel/Neon
- `../apps/web/docs/V15_SANITY_CHECKLIST.md`
  - checklist historical khusus patch V15

- Stage 8: `docs/perf-refactor-stage-08-final-hardening.md`

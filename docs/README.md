# Docs index

Dokumen yang dianggap **paling relevan** untuk kerja sehari-hari:

1) `00-stage0-safety-net.md`
   - aturan main sebelum refactor besar
   - cara menjalankan `verify`

2) `REGRESSION_CHECKLIST.md`
   - checklist manual untuk memastikan **fitur tidak hilang** setelah refactor

3) `01-repo-structure.md`
   - struktur folder repo, konvensi, dan tooling yang dipakai

4) `02-code-style.md`
   - formatting (Prettier)
   - lint (Next/ESLint)
   - conventions import & struktur server/client

5) `03-server-client-boundary.md`
   - aturan folder `server/` vs `lib/`
   - marker `server-only` / `client-only`


6) `04-api-route-helpers.md`
   - helper & konvensi untuk Next.js route handlers (API)
   - error handling konsisten via `apiRoute(...)`

7) `stage-05-services.md`
   - pemindahan business logic ke service layer (route handler jadi tipis)

8) `stage-06-ui-split.md`
   - pemecahan komponen UI besar ("monster files") menjadi modul & hooks

9) `stage-07-data-access.md`
   - standarisasi select/include Prisma + pagination helper + index hygiene

Dokumen deployment singkat ada di `../DEPLOYMENT.md` (root) dan detailnya ada di `apps/web/docs/`.

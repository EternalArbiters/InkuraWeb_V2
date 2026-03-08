# Stage 13 — DB profiling runbook

Tujuan tahap ini adalah menutup gap Tahap D dengan workflow profiling yang bisa diulang, bukan menebak-nebak index.

## Sumber sinyal yang dipakai

- `db.slow_query` dari Prisma query logging
- `db.profile_probe` dari hotspot service probes
- `api.slow_route` dan `page.slow_render` untuk mencari route/page yang mendorong query mahal

## Probe yang sekarang tersedia

- `listPublishedWorks.findMany`
- `listPublishedWorks.viewerInteractions`
- `home.publicRails`
- `home.viewerPayload`
- `search.publicShell`
- `search.viewerPayload`
- `search.pageData`
- `workPage.public`
- `workPage.viewerPayload`
- `profile.public`
- `profile.viewerPayload`
- `notifications.list`
- `library.viewer`
- `studioWorks.list`

Set `INKURA_PROFILE_HOTSPOTS=1` bila ingin melihat probe yang tidak slow juga, untuk sesi profiling singkat.

## Prosedur profiling

1. Nyalakan traffic nyata atau ulangi flow yang paling sering dipakai.
2. Kumpulkan `db.profile_probe` selama 10–30 menit.
3. Kelompokkan berdasarkan `probe` dan fingerprint/filter meta.
4. Ambil kandidat teratas berdasarkan:
   - frekuensi
   - durasi p95/p99
   - dampak user-facing (`api.slow_route`, `page.slow_render`)
5. Cocokkan probe dengan `db.slow_query` yang muncul pada rentang waktu yang sama.
6. Ambil query mentah/fingerprint, lalu jalankan `EXPLAIN ANALYZE` di DB.
7. Dokumentasikan hasil sebelum menambah index atau memecah query.

## Template pencatatan hasil

Untuk setiap kandidat, catat:

- probe
- file/service asal
- fingerprint filter/sort
- p95/p99 durasi
- query preview / SQL fingerprint
- jumlah row yang diproses
- apakah index saat ini kepakai
- keputusan: keep / add index / trim select / split query / cache

## Hotspot pertama yang wajib diperiksa

1. `listPublishedWorks.findMany`
   - variasi `newest`, `liked`, `rated`
   - kombinasi filter genre/tag/lang/publishType
2. `notifications.list`
3. `library.viewer`
4. `studioWorks.list`

## Definisi selesai Tahap D berikutnya

Tahap D dianggap benar-benar tuntas setelah ada minimal:

- 3 fingerprint query `listPublishedWorks` dengan `EXPLAIN ANALYZE`
- 1 fingerprint untuk notifications
- 1 fingerprint untuk library atau studio works
- keputusan index/query tuning terdokumentasi berdasarkan hasil di atas


## Artefak pencatatan

Gunakan `docs/perf-refactor-stage-16-production-query-evidence-template.md` untuk setiap query/fingerprint yang masuk shortlist.

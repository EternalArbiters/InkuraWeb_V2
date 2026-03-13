# Stage 13 — DB profiling runbook

The goal of this stage is menutup gap Stage D with workflow profiling that can diulang, not menebak-nebak index.

## Sumber sinyal used

- `db.slow_query` from Prisma query logging
- `db.profile_probe` from hotspot service probes
- `api.slow_route` and `page.slow_render` to find routes/pages that drive matching queries

## Probe current tersedia

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

Set `INKURA_PROFILE_HOTSPOTS=1` if ingin see probe that not slow juga, for sesi profiling singkat.

## Prosedur profiling

1. Nyalakan traffic nyata or ulangi flow that most often used.
2. Kumpulkan `db.profile_probe` seold 10–30 menit.
3. Kelompokkan berdasarkan `probe` and fingerprint/filter meta.
4. Ambil kandidat teratas berdasarkan:
   - frekuensi
   - durasi p95/p99
   - dampak user-facing (`api.slow_route`, `page.slow_render`)
5. Cocokkan probe with `db.slow_query` that appear on rentang waktu same.
6. Ambil query mentah/fingerprint, then jalankan `EXPLAIN ANALYZE` in DB.
7. Dokumentasikan hasil before menambah index or memecah query.

## Template pencatatan hasil

For each kandidat, catat:

- probe
- file/service asal
- fingerprint filter/sort
- p95/p99 durasi
- query preview / SQL fingerprint
- jumlah row that processed
- apakah index currently keuse
- keputusan: keep / add index / trim select / split query / cache

## Hotspot pertama that required diperiksa

1. `listPublishedWorks.findMany`
   - variasi `newest`, `liked`, `rated`
   - kombinasi filter genre/tag/lang/publishType
2. `notifications.list`
3. `library.viewer`
4. `studioWorks.list`

## Defincontent complete Stage D next

Stage D considered benar-benar tuntas after there is minimal:

- 3 fingerprint query `listPublishedWorks` with `EXPLAIN ANALYZE`
- 1 fingerprint for notifications
- 1 fingerprint for library or studio works
- keputusan index/query tuning terdokumentasi berdasarkan hasil in atas


## Artefak pencatatan

Gunakan `docs/perf-refactor-stage-16-production-query-evidence-template.md` for each query/fingerprint that enter shortlist.

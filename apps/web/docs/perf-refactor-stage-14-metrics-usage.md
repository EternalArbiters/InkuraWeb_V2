# Stage 14 — observability and metrics usage

Dokumen ini menjelaskan cara membaca metrik yang sudah ditanam pada Tahap F dan Paket 3/4.

## Event penting

### Server
- `api.slow_route`
- `api.response_error`
- `api.unhandled_error`
- `db.slow_query`
- `db.profile_probe`
- `page.render`
- `page.slow_render`

### Client
- `client.metric`
- unread polling metric dari `NavCountBadge`
- upload metric dari client uploader

## Env yang relevan

- `INKURA_SLOW_ROUTE_MS`
- `INKURA_SLOW_PAGE_RENDER_MS`
- `INKURA_SLOW_QUERY_MS`
- `INKURA_CLIENT_WARN_MS`
- `INKURA_LOG_QUERIES=1` untuk melihat seluruh query Prisma
- `INKURA_PROFILE_HOTSPOTS=1` untuk melihat semua hotspot probe, bukan hanya yang slow

## Cara membaca cepat

### Kalau route terasa lambat
1. Cari `api.slow_route`
2. Cocokkan timestamp dengan `page.slow_render` atau `db.profile_probe`
3. Lihat apakah akar masalahnya render, query, atau polling

### Kalau search/home/library terasa berat
1. Cari `db.profile_probe`
2. Periksa probe mana yang dominan
3. Cocokkan dengan `db.slow_query`
4. Jalankan `EXPLAIN ANALYZE` untuk kandidat teratas

### Kalau upload terasa berat
1. Lihat `client.metric` untuk upload
2. Bandingkan `beforeBytes`, `afterBytes`, `uploadMs`, `durationMs`
3. Setelah tahap kompres aktif, pantau rasio pengurangan ukuran per scope

### Kalau unread badge terasa noisy
1. Lihat metrik polling unread
2. Periksa `durationMs` dan `intervalSincePreviousPollMs`
3. Pastikan polling tidak terlalu rapat pada halaman dengan traffic tinggi

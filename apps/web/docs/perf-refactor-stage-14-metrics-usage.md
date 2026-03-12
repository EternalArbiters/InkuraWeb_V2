# Stage 14 — observability and metrics usage

This document explain cara reading metrik already ditanam pada Tahap F and Paket 3/4.

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
- unread polling metric from `NavCountBadge`
- upload metric from client uploader

## Env that are relevant

- `INKURA_SLOW_ROUTE_MS`
- `INKURA_SLOW_PAGE_RENDER_MS`
- `INKURA_SLOW_QUERY_MS`
- `INKURA_CLIENT_WARN_MS`
- `INKURA_LOG_QUERIES=1` to see seluruh query Prisma
- `INKURA_PROFILE_HOTSPOTS=1` to see all hotspot probe, not only that slow

## Cara reading cepat

### If route terasa lambat
1. Cari `api.slow_route`
2. Cocokkan timestamp with `page.slow_render` or `db.profile_probe`
3. Lihat apakah akar masalahnya render, query, or polling

### If search/home/library terasa berat
1. Cari `db.profile_probe`
2. Periksa probe mana that dominan
3. Cocokkan with `db.slow_query`
4. Jalankan `EXPLAIN ANALYZE` for kandidat teratas

### If upload terasa berat
1. Lihat `client.metric` for upload
2. Bandingkan `beforeBytes`, `afterBytes`, `uploadMs`, `durationMs`
3. Setelah stage kompres active, pantau rasio pengurangan ukuran per scope

### If unread badge terasa noisy
1. Lihat metrik polling unread
2. Periksa `durationMs` and `intervalSincePreviousPollMs`
3. Pastikan polling not terthen rapat pada page with traffic tinggi

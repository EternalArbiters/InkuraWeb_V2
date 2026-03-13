# Stage 14 — observability and metrics usage

This document explain cara reading metrik already ditanam on Stage F and Paket 3/4.

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
- `INKURA_LOG_QUERIES=1` to see entire query Prisma
- `INKURA_PROFILE_HOTSPOTS=1` to see all hotspot probe, not only that slow

## Cara reading cepat

### If route terasa lambat
1. Look for `api.slow_route`
2. Cocokkan timestamp with `page.slow_render` or `db.profile_probe`
3. See whether the root cause is rendering, queries, or polling

### If search/home/library terasa heavy
1. Look for `db.profile_probe`
2. Periksa probe mana that dominan
3. Cocokkan with `db.slow_query`
4. Jalankan `EXPLAIN ANALYZE` for kandidat teratas

### If upload terasa heavy
1. Look at `client.metric` for uploads
2. Bandingkan `beforeBytes`, `afterBytes`, `uploadMs`, `durationMs`
3. Setelah stage kompres active, pantau rasio pengurangan ukuran per scope

### If unread badge terasa noisy
1. Look at the unread polling metrics
2. Periksa `durationMs` and `intervalSincePreviousPollMs`
3. Pastikan polling not terthen rapat on page with traffic high

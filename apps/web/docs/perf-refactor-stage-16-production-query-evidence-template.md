# Stage 16 — production query evidence template

Gunakan template ini saat menutup Tahap D dengan data production nyata.

## Header

- tanggal:
- environment:
- feature / route:
- probe:
- owner:

## Sinyal awal

- `db.profile_probe`:
- `db.slow_query`:
- `api.slow_route` / `page.slow_render` terkait:
- traffic / frekuensi:

## Fingerprint query

- service file:
- query family:
- filter utama:
- sort utama:
- expected row count:
- actual row count:

## EXPLAIN ANALYZE

- SQL fingerprint:
- plan summary:
- total execution time:
- rows scanned:
- rows returned:
- index used:
- join/filter paling mahal:

## Putusan

- [ ] keep as-is
- [ ] add index
- [ ] trim select
- [ ] split query
- [ ] cache public result
- [ ] revisit after more traffic

## Patch yang diambil

- files changed:
- migration/index:
- risk:
- rollback note:

## Verifikasi setelah patch

- p95/p99 sebelum:
- p95/p99 sesudah:
- slow query masih muncul?
- side effect / regression:

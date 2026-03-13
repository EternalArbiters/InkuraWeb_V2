# Stage 16 — production query evidence template

Gunakan template this when menutup Stage D with data production nyata.

## Header

- tanggal:
- environment:
- feature / route:
- probe:
- owner:

## Sinyal initial

- `db.profile_probe`:
- `db.slow_query`:
- `api.slow_route` / `page.slow_render` related:
- traffic / frekuensi:

## Fingerprint query

- service file:
- query family:
- filter main:
- sort main:
- expected row count:
- actual row count:

## EXPLAIN ANALYZE

- SQL fingerprint:
- plan summary:
- total execution time:
- rows scanned:
- rows returned:
- index used:
- join/filter most mathing:

## Putusan

- [ ] keep as-is
- [ ] add index
- [ ] trim select
- [ ] split query
- [ ] cache public result
- [ ] revcontentt after more traffic

## Patch that diambil

- files changed:
- migration/index:
- risk:
- rollback note:

## Verifikasi after patch

- p95/p99 before:
- p95/p99 sealready:
- slow query still appear?
- side effect / regression:

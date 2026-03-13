# Perf Refactor Stage 11 — observability and metrics

This stage menambah observability that more operasional for iterasi performa next.

## Sasaran

- tahu API route mana that benar-benar lambat
- tahu query Prisma mana that become hotspot nyata
- punya jejak waktu render for page large
- punya metrik polling unread badge from browser
- punya metrik upload client (durasi + ukuran before/after) for baseline before stage kompres upload

## What was added

### 1. Slow API route metrics

`apps/web/server/http/route.ts`

- all route that through `apiRoute()` now automatic:
  - adding header `server-timing`
  - log `api.slow_route` if durasi methroughi threshold
  - still mempertahankan structured error logging already there is

### 2. Slow Prisma query metrics

`apps/web/server/db/prisma.ts`
`apps/web/server/observability/metrics.ts`

- Prisma singleton now mengactivekan event `query`
- query lambat will dilog as `db.slow_query`
- query preview dipendekkan so that log still safe and terbaca
- optional `INKURA_LOG_QUERIES=1` can used for investigasi that more verbose

### 3. Server page render timing

Page large current melog metrik render:

- `/home`
- `/w/[slug]`
- `/w/[slug]/read/[chapterId]`
- `/lists/[slug]`
- `/u/[username]`

Event that exit:

- `page.render`
- `page.slow_render`

## 4. Client metric ingestion

Route new:

- `/api/client-metrics`

File new:

- `apps/web/lib/clientMetrics.ts`
- `apps/web/server/services/api/client-metrics/route.ts`
- `apps/web/app/api/client-metrics/route.ts`

Goal route this is receives metrik light from browser and meneruskannya to structured log server.

## 5. Unread polling metrics

`apps/web/app/components/NavCountBadge.tsx`

Badge unread now mengirim metrik:

- endpoint that dipoll
- trigger (`mount`, `timer`, `focus`, `vcontentbility`, `external`, `online`)
- durasi fetch
- count hasil
- interval since poll previously

Ini memberi jejak nyata tentang frekuensi polling unread count.

## 6. Upload client metrics

File that touched:

- `apps/web/lib/r2UploadClient.ts`
- `apps/web/lib/commentMediaClient.ts`
- `apps/web/app/settings/profile/ProfileForm.tsx`

Metrik that dikirim:

- `scope`
- `beforeBytes`
- `afterBytes`
- `durationMs`
- `presignMs`
- `uploadMs`
- `contentType`
- `compressionApplied`
- `outcome`

Note:

- because stage kompres upload not yet dikerjakan, `beforeBytes` and `afterBytes` currently still same
- structure metrik this intentionally already dcontentapkan so that Stage upload compression later stay mengcontent ukuran hasil optimasi

## Threshold default

- `INKURA_SLOW_ROUTE_MS=600`
- `INKURA_SLOW_PAGE_RENDER_MS=900`
- `INKURA_SLOW_QUERY_MS=250`
- `INKURA_CLIENT_WARN_MS=4000`

## Dampak

This stage not yet saving performa secara directly sebesar split cache/query, but sangat penting because:

- reducing optimasi that sifatnya menebak-nebak
- mempermudah identifikasi route/query/page that most mathing
- menyiapkan baseline upload metrics before kompres browser-side dikerjakan

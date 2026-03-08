# Perf Refactor Stage 11 — observability dan metrics

Tahap ini menambah observability yang lebih operasional untuk iterasi performa berikutnya.

## Sasaran

- tahu API route mana yang benar-benar lambat
- tahu query Prisma mana yang jadi hotspot nyata
- punya jejak waktu render untuk page besar
- punya metrik polling unread badge dari browser
- punya metrik upload client (durasi + ukuran before/after) untuk baseline sebelum tahap kompres upload

## Yang ditambahkan

### 1. Slow API route metrics

`apps/web/server/http/route.ts`

- semua route yang lewat `apiRoute()` sekarang otomatis:
  - menambahkan header `server-timing`
  - log `api.slow_route` bila durasi melewati threshold
  - tetap mempertahankan structured error logging yang sudah ada

### 2. Slow Prisma query metrics

`apps/web/server/db/prisma.ts`
`apps/web/server/observability/metrics.ts`

- Prisma singleton sekarang mengaktifkan event `query`
- query lambat akan dilog sebagai `db.slow_query`
- query preview dipendekkan agar log tetap aman dan terbaca
- optional `INKURA_LOG_QUERIES=1` bisa dipakai untuk investigasi yang lebih verbose

### 3. Server page render timing

Page besar yang sekarang melog metrik render:

- `/home`
- `/w/[slug]`
- `/w/[slug]/read/[chapterId]`
- `/lists/[slug]`
- `/u/[username]`

Event yang keluar:

- `page.render`
- `page.slow_render`

## 4. Client metric ingestion

Route baru:

- `/api/client-metrics`

File baru:

- `apps/web/lib/clientMetrics.ts`
- `apps/web/server/services/api/client-metrics/route.ts`
- `apps/web/app/api/client-metrics/route.ts`

Tujuan route ini adalah menerima metrik ringan dari browser dan meneruskannya ke structured log server.

## 5. Unread polling metrics

`apps/web/app/components/NavCountBadge.tsx`

Badge unread sekarang mengirim metrik:

- endpoint yang dipoll
- trigger (`mount`, `timer`, `focus`, `visibility`, `external`, `online`)
- durasi fetch
- count hasil
- interval sejak poll sebelumnya

Ini memberi jejak nyata tentang frekuensi polling unread count.

## 6. Upload client metrics

File yang disentuh:

- `apps/web/lib/r2UploadClient.ts`
- `apps/web/lib/commentMediaClient.ts`
- `apps/web/app/settings/profile/ProfileForm.tsx`

Metrik yang dikirim:

- `scope`
- `beforeBytes`
- `afterBytes`
- `durationMs`
- `presignMs`
- `uploadMs`
- `contentType`
- `compressionApplied`
- `outcome`

Catatan:

- karena tahap kompres upload belum dikerjakan, `beforeBytes` dan `afterBytes` saat ini masih sama
- struktur metrik ini sengaja sudah disiapkan supaya Tahap upload compression nanti tinggal mengisi ukuran hasil optimasi

## Threshold default

- `INKURA_SLOW_ROUTE_MS=600`
- `INKURA_SLOW_PAGE_RENDER_MS=900`
- `INKURA_SLOW_QUERY_MS=250`
- `INKURA_CLIENT_WARN_MS=4000`

## Dampak

Tahap ini belum menghemat performa secara langsung sebesar split cache/query, tetapi sangat penting karena:

- mengurangi optimasi yang sifatnya menebak-nebak
- mempermudah identifikasi route/query/page yang paling mahal
- menyiapkan baseline upload metrics sebelum kompres browser-side dikerjakan

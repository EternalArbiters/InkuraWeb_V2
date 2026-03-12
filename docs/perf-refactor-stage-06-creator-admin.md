# Perf refactor stage 06 — creator/admin surface and final page fan-out cleanup

Tahap 6 menutup sisa self-fetch server page in surface creator/admin that still tersisa after stage 5:

- studio work detail `/studio/works/[workId]`
- new chapter `/studio/works/[workId]/chapters/new`
- edit chapter `/studio/works/[workId]/chapters/[chapterId]/edit`
- comic pages manager `/studio/works/[workId]/chapters/[chapterId]/pages`
- admin reports `/admin/reports`

## Masalah before stage 6

Sisa hotspot `apiJson()` memang already tinggal sedikit, tetapi allnya there is in area that relatif berat:

- studio work detail reading work + chapters milik creator
- chapter edit/pages reading chapter + work + warnings
- admin reports reading report + comment + work/chapter target

Senot yet stage this, flownya still:

`server page -> fetch /api/... -> route handler -> service/db`

Artinya surface creator/admin still menghasilkan invocation additional even though all data aslinya already tersedia in service server-only.

## Perubahan main

### 1. Studio pages use service directly

Server page berikut berhenti self-fetch to API internal:

- `app/studio/works/[workId]/page.tsx`
- `app/studio/works/[workId]/chapters/new/page.tsx`
- `app/studio/works/[workId]/chapters/[chapterId]/edit/page.tsx`
- `app/studio/works/[workId]/chapters/[chapterId]/pages/page.tsx`

Service used again:

- `server/services/studio/workById.ts`
- `server/services/studio/chapters.ts`
- `server/services/taxonomy/publicTaxonomy.ts`

Behavior redirect old still dijaga:

- studio work / new chapter still fallback to `/studio`
- chapter edit/pages still membedakan `401 -> signin`, `403 -> back to work`, `404 -> notFound`

### 2. Admin reports dipindah to reusable service

Ditambahkan:

- `apps/web/server/services/admin/reports.ts`

Service this memusatkan query report terbuka, lookup comment target, and hydrasi target work/chapter. Diuse again oleh:

- `app/admin/reports/page.tsx`
- `server/services/api/admin/reports/route.ts`

Jadi page admin not lagi routing request through `/api/admin/reports` only to read data same.

## Kenapa this safe

- not there is features that dihapus
- API route is still kept for client-side calls and kompatibilitas
- changed only jflow data server page: directly to service, not through HTTP internal
- redirect behavior old kept so that UX still consistent

## Dampak that ditargetkan

Tahap 6 menyelesaikan sisa fan-out server page remaining from stage 5.

Perubahan statis that most penting:

- server-page import `apiJson()`: `5 -> 0`
- call `apiJson()` in `app/**` remaining from page/component server: `8 -> 0` for page code that nyata

Catatan baseline scanner:

- output scanner still can menampilkan `apiJson calls inside app/: 1`
- that berasal from file helper `server/http/apiJson.ts`, not from page app that still self-fetch
- pengecekan directly `rg` pada `apps/web/app/**` now point tokan `0` pemanggilan `apiJson()`

## File new

- `apps/web/server/services/admin/reports.ts`
- `docs/perf-refactor-stage-06-creator-admin.md`

## File that diubah

- `apps/web/app/studio/works/[workId]/page.tsx`
- `apps/web/app/studio/works/[workId]/chapters/new/page.tsx`
- `apps/web/app/studio/works/[workId]/chapters/[chapterId]/edit/page.tsx`
- `apps/web/app/studio/works/[workId]/chapters/[chapterId]/pages/page.tsx`
- `apps/web/app/admin/reports/page.tsx`
- `apps/web/server/services/api/admin/reports/route.ts`

## Catatan verifikasi

Minimum verification that was successfully run in this working environment:

- `node apps/web/scripts/refactor-stage0-baseline.js`
- `tsc --noEmit -p apps/web/tsconfig.json`
  - still failed because environment this not menyediakan type definition `next-auth`
  - kefailedannya not point tokan error new spesifik from edit stage 6

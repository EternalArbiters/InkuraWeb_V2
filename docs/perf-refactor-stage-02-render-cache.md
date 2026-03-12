# Perf Refactor — Tahap 2 Render Scope & Public Cache

Tahap 2 focuses on two things that safest without menghilangkan features:

1. **reducing scope dynamic that terthen lebar**
2. **memberi cache that benar to data public that not personal**

This stage dibangun directly in atas ZIP hasil stage 1.

## Sasaran stage this

Masalah that still tersisa after stage 1:

- root layout still memaksa seluruh app ikut dynamic
- taxonomy API still mengirim `Cache-Control: no-store`
- several page public sederhana still self-fetch to API internal
- pembacaan session/viewer same still can terulang in request same

## Perubahan that enter in stage 2

### 1. Root layout not lagi memaksa seluruh app dynamic

File:

- `apps/web/app/layout.tsx`

Perubahan:

- `export const dynamic = "force-dynamic"` dihapus from root layout
- now only page/route that memang perlu auth/session that still menandai dirinya dynamic

Dampak:

- seluruh tree app not lagi otomatis ikut dihitung dynamic only because root layout
- behavior features still sama, because leaf page that memang auth-heavy still still dynamic

### 2. Taxonomy API public now use cache header public

File:

- `apps/web/server/http/cacheControl.ts`
- `apps/web/server/services/api/genres/route.ts`
- `apps/web/server/services/api/tags/route.ts`
- `apps/web/server/services/api/warnings/route.ts`
- `apps/web/server/services/api/deviant-love/route.ts`

Perubahan:

- route public taxonomy not lagi mengirim `Cache-Control: no-store`
- now mengirim cache header public:
  - `s-maxage=300`
  - `stale-while-revalidate=86400`

Dampak:

- query taxonomy same not must sethen menghantam function runtime
- CDN/Vercel cache can membantu for request public berulang
- invalidasi DB still safe because base read still memakai `revalidateTag("taxonomy")`

### 3. Page discovery public berhenti self-fetch to API internal

File:

- `apps/web/app/genre/page.tsx`
- `apps/web/app/all/page.tsx`
- `apps/web/app/comic/page.tsx`
- `apps/web/app/novel/page.tsx`
- `apps/web/app/browse/_components/BrowseListPage.tsx`

Perubahan:

- page-page this now calls service server directly, not through HTTP internal `/api/...`
- kontrak API is still kept for caller client-side

Note:

- `genre/page.tsx` now explicit `revalidate = 300` because not personal
- list page discovery (`all/comic/novel/browse`) still dynamic because still mempertahankan behavior viewer-aware from service `listPublishedWorksFromSearchParams()`

### 4. Page statis sederhana not lagi dipaksa dynamic

File:

- `apps/web/app/donate/page.tsx`

Perubahan:

- route donate now `revalidate = 3600`
- not lagi `force-dynamic`

## Dampak baseline statis

Setelah stage 2, hasil scan `npm run refactor:stage0` menjadi:

- `force-dynamic` exports: **45 → 37**
- server-page import `apiJson()`: **25 → 20**
- total call `apiJson()` in `app/**`: **29 → 24**
- `cache: "no-store"`: **7** _(not yet disentuh in stage this)_
- header `Cache-Control: no-store`: **4 → 0**
- `setInterval()`: **3** _(not yet disentuh in stage this)_

## Intentionally not touched yet

Tahap 2 not yet menyentuh:

- polling unread notification 30 detik
- middleware surface for protected routes
- direct-call refactor for page auth-heavy lain seperti library, notifications, studio, reader, work detail
- batching query Prisma that more dalam

Semua that ditahan for stage berikutnya so that rcontentko regresi still kecil.

## Verifikasi minimum

- `npm run refactor:stage0`
- `npm run test:unit -- --runInBand` *(if environment dependency siap)*
- `npm run typecheck` *(if dependency local already terpasang)*
- `docs/REGRESSION_CHECKLIST.md`

## Baseline for stage 3

Tahap 3 must dimulai from ZIP hasil stage 2 this, not from snapshot stage 1.

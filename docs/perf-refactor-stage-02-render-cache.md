# Perf Refactor — Tahap 2 Render Scope & Public Cache

Tahap 2 fokus ke dua hal yang paling aman tanpa menghilangkan fitur:

1. **mengurangi scope dynamic yang terlalu lebar**
2. **memberi cache yang benar ke data publik yang tidak personal**

Tahap ini dibangun langsung di atas ZIP hasil tahap 1.

## Sasaran tahap ini

Masalah yang masih tersisa setelah tahap 1:

- root layout masih memaksa seluruh app ikut dynamic
- taxonomy API masih mengirim `Cache-Control: no-store`
- beberapa page publik sederhana masih self-fetch ke API internal
- pembacaan session/viewer yang sama masih bisa terulang di request yang sama

## Perubahan yang masuk di tahap 2

### 1. Root layout tidak lagi memaksa seluruh app dynamic

File:

- `apps/web/app/layout.tsx`

Perubahan:

- `export const dynamic = "force-dynamic"` dihapus dari root layout
- sekarang hanya page/route yang memang perlu auth/session yang tetap menandai dirinya dynamic

Dampak:

- seluruh tree app tidak lagi otomatis ikut dihitung dynamic hanya karena root layout
- behavior fitur tetap sama, karena leaf page yang memang auth-heavy masih tetap dynamic

### 2. Taxonomy API publik sekarang pakai cache header publik

File:

- `apps/web/server/http/cacheControl.ts`
- `apps/web/server/services/api/genres/route.ts`
- `apps/web/server/services/api/tags/route.ts`
- `apps/web/server/services/api/warnings/route.ts`
- `apps/web/server/services/api/deviant-love/route.ts`

Perubahan:

- route publik taxonomy tidak lagi mengirim `Cache-Control: no-store`
- sekarang mengirim cache header publik:
  - `s-maxage=300`
  - `stale-while-revalidate=86400`

Dampak:

- query taxonomy yang sama tidak harus selalu menghantam function runtime
- CDN/Vercel cache bisa membantu untuk request publik berulang
- invalidasi DB tetap aman karena base read masih memakai `revalidateTag("taxonomy")`

### 3. Page discovery publik berhenti self-fetch ke API internal

File:

- `apps/web/app/genre/page.tsx`
- `apps/web/app/all/page.tsx`
- `apps/web/app/comic/page.tsx`
- `apps/web/app/novel/page.tsx`
- `apps/web/app/browse/_components/BrowseListPage.tsx`

Perubahan:

- page-page ini sekarang memanggil service server langsung, bukan lewat HTTP internal `/api/...`
- kontrak API tetap dipertahankan untuk caller client-side

Catatan:

- `genre/page.tsx` sekarang explicit `revalidate = 300` karena tidak personal
- list page discovery (`all/comic/novel/browse`) tetap dynamic karena masih mempertahankan behavior viewer-aware dari service `listPublishedWorksFromSearchParams()`

### 4. Page statis sederhana tidak lagi dipaksa dynamic

File:

- `apps/web/app/donate/page.tsx`

Perubahan:

- route donate sekarang `revalidate = 3600`
- tidak lagi `force-dynamic`

## Dampak baseline statis

Setelah tahap 2, hasil scan `npm run refactor:stage0` menjadi:

- `force-dynamic` exports: **45 → 37**
- server-page import `apiJson()`: **25 → 20**
- total call `apiJson()` di `app/**`: **29 → 24**
- `cache: "no-store"`: **7** _(belum disentuh di tahap ini)_
- header `Cache-Control: no-store`: **4 → 0**
- `setInterval()`: **3** _(belum disentuh di tahap ini)_

## Yang sengaja belum disentuh

Tahap 2 belum menyentuh:

- polling unread notification 30 detik
- middleware surface untuk protected routes
- direct-call refactor untuk page auth-heavy lain seperti library, notifications, studio, reader, work detail
- batching query Prisma yang lebih dalam

Semua itu ditahan untuk tahap berikutnya supaya risiko regresi tetap kecil.

## Verifikasi minimum

- `npm run refactor:stage0`
- `npm run test:unit -- --runInBand` *(bila environment dependency siap)*
- `npm run typecheck` *(bila dependency lokal sudah terpasang)*
- `docs/REGRESSION_CHECKLIST.md`

## Baseline untuk tahap 3

Tahap 3 harus dimulai dari ZIP hasil tahap 2 ini, bukan dari snapshot tahap 1.

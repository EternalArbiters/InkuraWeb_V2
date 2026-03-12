# Perf Refactor — Tahap 1 Fan-out Request Reduction

Tahap 1 focuses on one target: **reducing fan-out requests from server pages to internal APIs** without removing any features.

## Sasaran stage this

Masalah awal in baseline stage 0:

- `app/home/page.tsx` melakukan 5x `apiJson()` to `/api/works`
- `app/search/page.tsx` melakukan fetch server-side for prefs, taxonomy, then `/api/works`
- `app/settings/account/page.tsx` calls prefs + 3 taxonomy endpoint
- `app/studio/new/page.tsx` calls prefs + 3 taxonomy endpoint
- `app/studio/works/[workId]/edit/page.tsx` calls detail work + 3 taxonomy endpoint

Pola tersebut membuat satu page render berubah menjadi banyak invocation server internal.

## Perubahan that enter in stage 1

### 1. Home page berhenti self-fetch to `/api/works`

`apps/web/app/home/page.tsx`

Sekarang home calls loader server directly:

- `apps/web/server/services/home/getHomePageData.ts`
- `apps/web/server/services/works/listPublishedWorks.ts`

API route `/api/works` is still kept for client / external caller that still membutuhkannya.

### 2. Search page berhenti self-fetch to prefs, taxonomy, and `/api/works`

`apps/web/app/search/page.tsx`

Sekarang search directly memakai service server:

- `getViewerPreferences()`
- `listActiveGenres()`
- `listActiveWarningTags()`
- `listActiveDeviantLoveTags()`
- `listPublishedWorksFromSearchParams()`

Behavior filter, gating, and hasil search still kept.

### 3. Settings account berhenti self-fetch to API internal

`apps/web/app/settings/account/page.tsx`

Sekarang page this mengambil:

- preferences directly from service server
- taxonomy directly from service server

Redirect login still kept.

### 4. Studio create/edit berhenti self-fetch to API internal

File that dibenahi:

- `apps/web/app/studio/new/page.tsx`
- `apps/web/app/studio/works/[workId]/edit/page.tsx`

Studio still punya behavior same:

- unauthorized → redirect to signin
- edit work that failed in-load → redirect balik to detail studio work

### 5. Service reusable new to avoid duplikasi logic page vs API

Ditambahkan:

- `apps/web/server/services/preferences/viewerPreferences.ts`
- `apps/web/server/services/taxonomy/publicTaxonomy.ts`

API route berikut now reuse service same, become kontrak API still hidup without copy-paste logic new:

- `/api/me/preferences`
- `/api/genres`
- `/api/warnings`
- `/api/deviant-love`

### 6. `listPublishedWorks` can used directly from page server

`apps/web/server/services/works/listPublishedWorks.ts`

Ditambahkan entrypoint new:

- `listPublishedWorksFromSearchParams(searchParams)`

Sehingga server page not perlu membangun HTTP request internal only for memakai logic same.

## Dampak baseline statis

Setelah stage 1, hasil scan `npm run refactor:stage0` menjadi:

- `force-dynamic` exports: **45** _(not yet disentuh in stage this)_
- server-page import `apiJson()`: **25** _(turun from 30)_
- total call `apiJson()` in `app/**`: **29** _(turun from 50)_
- `cache: "no-store"`: **7** _(not yet disentuh in stage this)_
- header `Cache-Control: no-store`: **4** _(not yet disentuh in stage this)_
- `setInterval()`: **3** _(not yet disentuh in stage this)_

## Delta dibanding baseline stage 0

Perubahan statis that most terasa:

- server-page import `apiJson()` turun **30 → 25**
- total call `apiJson()` in `app/**` turun **50 → 29**

Artinya stage 1 already memangkas sebagian besar hotspot self-fetch terbesar without mengubah features.

## Catatan that intentionally not yet disentuh

Tahap 1 **not yet** menyentuh:

- root `force-dynamic`
- strategi cache taxonomy/API
- polling unread notification
- dedupe query viewer/prefs lintas rail/home/search
- middleware surface

Itu memang ditahan for stage berikutnya so that rcontentko regresi still kecil.

## Verifikasi minimum for stage this

- scan statis: `npm run refactor:stage0`
- check manual: `docs/REGRESSION_CHECKLIST.md`

Catatan container work saat stage this dibuat:

- the static scan ran successfully
- pemasangan dependency sempat not stabil, become verifikasi penuh `npm run verify` not yet can dikonfirmasi bersih from container this

## Baseline for stage 2

Tahap 2 must dimulai from ZIP hasil stage 1 this, not from snapshot beforenya.

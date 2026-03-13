# Perf Refactor — Stage 1 Fan-out Request Reduction

Stage 1 focuses on one target: **reducing fan-out requests from server pages to internal APIs** without removing any features.

## Sasaran stage this

Masalah initial in baseline stage 0:

- `app/home/page.tsx` melakukan 5x `apiJson()` to `/api/works`
- `app/search/page.tsx` melakukan fetch server-side for prefs, taxonomy, then `/api/works`
- `app/settings/account/page.tsx` calls prefs + 3 taxonomy endpoint
- `app/studio/new/page.tsx` calls prefs + 3 taxonomy endpoint
- `app/studio/works/[workId]/edit/page.tsx` calls detail work + 3 taxonomy endpoint

Pola that make satu page render berubah become many invocation server internal.

## Perubahan that enter in stage 1

### 1. Home page berhenti self-fetch to `/api/works`

`apps/web/app/home/page.tsx`

Now the home page calls the server loader directly:

- `apps/web/server/services/home/getHomePageData.ts`
- `apps/web/server/services/works/listPublishedWorks.ts`

API route `/api/works` is still kept for client / external caller that still membutuhkannya.

### 2. Search page berhenti self-fetch to prefs, taxonomy, and `/api/works`

`apps/web/app/search/page.tsx`

Now search directly uses the server service:

- `getViewerPreferences()`
- `listActiveGenres()`
- `listActiveWarningTags()`
- `listActiveDeviantLoveTags()`
- `listPublishedWorksFromSearchParams()`

Behavior filter, gating, and hasil search still kept.

### 3. Settings account berhenti self-fetch to API internal

`apps/web/app/settings/account/page.tsx`

Now this page fetches:

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

Added:

- `apps/web/server/services/preferences/viewerPreferences.ts`
- `apps/web/server/services/taxonomy/publicTaxonomy.ts`

API route following now reuse service same, become kontrak API still hidup without copy-paste logic new:

- `/api/me/preferences`
- `/api/genres`
- `/api/warnings`
- `/api/deviant-love`

### 6. `listPublishedWorks` can used directly from page server

`apps/web/server/services/works/listPublishedWorks.ts`

Added a new entrypoint:

- `listPublishedWorksFromSearchParams(searchParams)`

Sehingga server page not need membangun HTTP request internal only for uses logic same.

## Dampak baseline statis

Setelah stage 1, hasil scan `npm run refactor:stage0` become:

- `force-dynamic` exports: **45** _(not yet touched in stage this)_
- server-page import `apiJson()`: **25** _(reduced from 30)_
- total call `apiJson()` in `app/**`: **29** _(reduced from 50)_
- `cache: "no-store"`: **7** _(not yet touched in stage this)_
- header `Cache-Control: no-store`: **4** _(not yet touched in stage this)_
- `setInterval()`: **3** _(not yet touched in stage this)_

## Delta dibanding baseline stage 0

Perubahan statis that most terasa:

- server-page import `apiJson()` reduced **30 → 25**
- total call `apiJson()` in `app/**` reduced **50 → 29**

Artinya stage 1 already memangkas sebagian large hotspot self-fetch terbesar without changing features.

## Notes on what has intentionally not been touched yet

Stage 1 **not yet** touch:

- root `force-dynamic`
- strategi cache taxonomy/API
- polling unread notification
- dedupe query viewer/prefs lintas rail/home/search
- middleware surface

Itu memang held for stage next so that rcontentko regression still small.

## Verifikasi minimum for stage this

- scan statis: `npm run refactor:stage0`
- check manual: `docs/REGRESSION_CHECKLIST.md`

Container work notes when this stage was created:

- the static scan ran successfully
- Dependency installation was briefly unstable, so a full `npm run verify` could not yet be confirmed as clean from this container.

## Baseline for stage 2

Stage 2 must dimulai from ZIP hasil stage 1 this, not from snapshot previously.

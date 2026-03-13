# Perf Refactor — Stage 4 Query Dedupe & Batching

Stage 4 focuses on **reducing repeated queries in the same request** without changing features or API contracts.

This stage is built directly on top of the ZIP produced by stage 3.

## Sasaran stage this

Masalah that still remaining after stage 3:

- lookup session and viewer prefs still can kebaca berulang in server request same
- page `/search` still reads viewer preferences and then enters work listing that reads the viewer again
- page `/home` memang already not self-fetch to API internal, but for viewer that is logged in still trigger query interaksi rail repeatedly
- helper prefs and helper viewer still punya jflow query that tumpang tindih

## Changes included in stage 4

### 1. Session and viewer lookup now request-scoped cached

File:

- `apps/web/server/auth/session.ts`
- `apps/web/server/services/works/viewer.ts`
- `apps/web/server/services/preferences/viewerPreferences.ts`

Perubahan:

- `getSession()` now dibungkus `react cache()`
- `getViewerBasic()` and `getViewerWithPrefs()` now uses lookup user ter-cache per request
- `getViewerPreferences()` not lagi query user sendiri; now memetakan hasil from `getViewerWithPrefs()`

Dampak:

- satu request server that needs session + prefs + gating not lagi reading user repeatedly
- helper berbeda still can used without changing features, but now berbagi sumber data same

### 2. Listing works now can receives viewer preloaded

File:

- `apps/web/server/services/works/listPublishedWorks.ts`

Perubahan:

- `listPublishedWorksFromSearchParams()` now receives opsi `viewer`
- caller server page can meneruskan viewer already dimiliki, become does not need to look the viewer up again inside the list service
- service juga receives opsi for mematikan query interaksi per-list when caller ingin melakukan batching sendiri

Dampak:

- caller seperti `/search` and `/home` can saving satu lapis lookup viewer/prefs
- API route still bekerja seperti previously because opsi this is additive, not a breaking change

### 3. Rail `/home` now batch viewer interactions sekali saja

File:

- `apps/web/server/services/home/getHomePageData.ts`
- `apps/web/server/services/works/viewerInteractions.ts` _(new)_

Perubahan:

- home rails still fetches 5 list work sesuai behavior old
- but flag viewer interaction (`viewerFavorited`, `viewerBookmarked`) not lagi dihitung per rail
- all work id from 5 rail dikumpulkan first, then likes + bookmarks viewer diambil **sekali batch**
- the batch results are then applied back to each rail

Dampak:

- for viewer login, query interaksi home reduced from **10 query** (5 likes + 5 bookmarks) become **2 query** total
- UI rail still receives flag same seperti previously

### 4. Haoldn `/search` now reuse viewer same for filter and hasil

File:

- `apps/web/app/search/page.tsx`

Perubahan:

- page now uses `getViewerWithPrefs()` directly
- viewer same used for:
  - default language preference
  - unlock logic mature / deviant love
  - calls `listPublishedWorksFromSearchParams()`

Dampak:

- request `/search` not lagi memisahkan lookup prefs and lookup viewer for listing
- features filter still same

### 5. Unit test small added for helper interaction mapping

File:

- `apps/web/tests/unit/viewer-work-interactions.spec.ts`

Perubahan:

- ensuring flag `viewerFavorited` and `viewerBookmarked` still attached benar when hasil batch diaplikasikan to row work

## Dampak baseline statis

Scan statis `npm run refactor:stage0` not many berubah in stage this because focuses on stage 4 is **dedupe query runtime**, not pengurangan jumlah file dynamic or jumlah self-fetch new.

Ekspektasi dampak main stage 4 there is in runtime:

- query user/session per request reduced
- query interaksi rail `/home` reduced tajam for viewer login
- request `/search` avoid lookup viewer duplicate

## Intentionally not touched yet

Stage 4 not yet touch:

- work detail / reader and jflow chapter edit that still punya peluang batching lain
- penambahan index DB new through migration Prisma
- invalidation cache that more agresif in level data public

That is intentionally deferred so this stage remains safe and does not force a schema migration.

## Verifikasi minimum

- `npm run refactor:stage0`
- check manual `/home` when login:
  - rail still appear
  - state bookmark/favorite still benar
- check manual `/search`:
  - default language still mengikuti prefs
  - mature/deviant filters still terkunci/terbuka sesuai prefs
- `docs/REGRESSION_CHECKLIST.md`

Container work notes when this stage was created:

- the static scan ran successfully
- A full `npm run verify` still could not be confirmed as clean because the workspace dependencies / Prisma CLI were not yet stable in this container environment.

## Baseline for stage 5

Stage 5 must start from this stage 4 ZIP, not from the stage 3 snapshot.

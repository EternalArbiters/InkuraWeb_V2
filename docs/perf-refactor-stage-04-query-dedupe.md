# Perf Refactor — Tahap 4 Query Dedupe & Batching

Tahap 4 focuses on **reducing repeated queries in the same request** without changing features or API contracts.

This stage is built directly on top of the ZIP produced by stage 3.

## Sasaran stage this

Masalah that still tersisa after stage 3:

- lookup session and viewer prefs still can kebaca berulang in server request same
- page `/search` still reads viewer preferences and then enters work listing that reads the viewer again
- page `/home` memang already not self-fetch to API internal, tetapi for viewer that is logged in still memicu query interaksi rail berkali-kali
- helper prefs and helper viewer still punya jflow query that tumpang tindih

## Changes included in stage 4

### 1. Session and viewer lookup now request-scoped cached

File:

- `apps/web/server/auth/session.ts`
- `apps/web/server/services/works/viewer.ts`
- `apps/web/server/services/preferences/viewerPreferences.ts`

Perubahan:

- `getSession()` now dibungkus `react cache()`
- `getViewerBasic()` and `getViewerWithPrefs()` now memakai lookup user ter-cache per request
- `getViewerPreferences()` not lagi query user sendiri; now memetakan hasil from `getViewerWithPrefs()`

Dampak:

- satu request server that needs session + prefs + gating not lagi reading user berkali-kali
- helper berbeda still can used without mengubah features, tetapi now berbagi sumber data same

### 2. Listing works now can menerima viewer preloaded

File:

- `apps/web/server/services/works/listPublishedWorks.ts`

Perubahan:

- `listPublishedWorksFromSearchParams()` now menerima opsi `viewer`
- caller server page can meneruskan viewer already dimiliki, become does not need to look the viewer up again inside the list service
- service juga menerima opsi for mematikan query interaksi per-list saat caller ingin melakukan batching sendiri

Dampak:

- caller seperti `/search` and `/home` can menghemat satu lapis lookup viewer/prefs
- API route still bekerja seperti beforenya because opsi this is additive, not a breaking change

### 3. Rail `/home` now batch viewer interactions sekali saja

File:

- `apps/web/server/services/home/getHomePageData.ts`
- `apps/web/server/services/works/viewerInteractions.ts` _(new)_

Perubahan:

- home rails still mengambil 5 list work sesuai behavior old
- tetapi flag viewer interaction (`viewerFavorited`, `viewerBookmarked`) not lagi dihitung per rail
- all work id from 5 rail dikumpulkan first, then likes + bookmarks viewer diambil **sekali batch**
- the batch results are then applied back to each rail

Dampak:

- for viewer login, query interaksi home turun from **10 query** (5 likes + 5 bookmarks) menjadi **2 query** total
- UI rail still menerima flag same seperti beforenya

### 4. Haoldn `/search` now reuse viewer same for filter and hasil

File:

- `apps/web/app/search/page.tsx`

Perubahan:

- page now memakai `getViewerWithPrefs()` directly
- viewer same used for:
  - default language preference
  - unlock logic mature / deviant love
  - calls `listPublishedWorksFromSearchParams()`

Dampak:

- request `/search` not lagi memisahkan lookup prefs and lookup viewer for listing
- features filter still sama

### 5. Unit test kecil ditambahkan for helper interaction mapping

File:

- `apps/web/tests/unit/viewer-work-interactions.spec.ts`

Perubahan:

- memastikan flag `viewerFavorited` and `viewerBookmarked` still terpasang benar saat hasil batch diaplikasikan to row work

## Dampak baseline statis

Scan statis `npm run refactor:stage0` not banyak berubah in stage this because fokus stage 4 adalah **dedupe query runtime**, not pengurangan jumlah file dynamic or jumlah self-fetch new.

Ekspektasi dampak main stage 4 there is in runtime:

- query user/session per request turun
- query interaksi rail `/home` turun tajam for viewer login
- request `/search` avoid lookup viewer duplikat

## Intentionally not touched yet

Tahap 4 not yet menyentuh:

- work detail / reader and jflow chapter edit that still punya peluang batching lain
- penambahan index DB new through migration Prisma
- invalidation cache that more agresif in level data public

That is intentionally deferred so this stage remains safe and does not force a schema migration.

## Verifikasi minimum

- `npm run refactor:stage0`
- check manual `/home` saat login:
  - rail still appear
  - state bookmark/favorite still benar
- check manual `/search`:
  - default language still mengikuti prefs
  - mature/deviant filters still terkunci/terbuka sesuai prefs
- `docs/REGRESSION_CHECKLIST.md`

Catatan container work saat stage this dibuat:

- the static scan ran successfully
- verifikasi penuh `npm run verify` still not yet can dikonfirmasi bersih because dependency workspace / Prisma CLI not yet stabil in environment container this

## Baseline for stage 5

Tahap 5 must start from this stage 4 ZIP, not from the stage 3 snapshot.

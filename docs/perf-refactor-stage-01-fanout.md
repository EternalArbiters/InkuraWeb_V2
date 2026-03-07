# Perf Refactor — Tahap 1 Fan-out Request Reduction

Tahap 1 fokus ke satu target: **mengurangi fan-out request dari server page ke API internal** tanpa menghilangkan fitur apa pun.

## Sasaran tahap ini

Masalah awal di baseline tahap 0:

- `app/home/page.tsx` melakukan 5x `apiJson()` ke `/api/works`
- `app/search/page.tsx` melakukan fetch server-side untuk prefs, taxonomy, lalu `/api/works`
- `app/settings/account/page.tsx` memanggil prefs + 3 taxonomy endpoint
- `app/studio/new/page.tsx` memanggil prefs + 3 taxonomy endpoint
- `app/studio/works/[workId]/edit/page.tsx` memanggil detail work + 3 taxonomy endpoint

Pola tersebut membuat satu page render berubah menjadi banyak invocation server internal.

## Perubahan yang masuk di tahap 1

### 1. Home page berhenti self-fetch ke `/api/works`

`apps/web/app/home/page.tsx`

Sekarang home memanggil loader server langsung:

- `apps/web/server/services/home/getHomePageData.ts`
- `apps/web/server/services/works/listPublishedWorks.ts`

API route `/api/works` tetap dipertahankan untuk client / external caller yang masih membutuhkannya.

### 2. Search page berhenti self-fetch ke prefs, taxonomy, dan `/api/works`

`apps/web/app/search/page.tsx`

Sekarang search langsung memakai service server:

- `getViewerPreferences()`
- `listActiveGenres()`
- `listActiveWarningTags()`
- `listActiveDeviantLoveTags()`
- `listPublishedWorksFromSearchParams()`

Behavior filter, gating, dan hasil search tetap dipertahankan.

### 3. Settings account berhenti self-fetch ke API internal

`apps/web/app/settings/account/page.tsx`

Sekarang page ini mengambil:

- preferences langsung dari service server
- taxonomy langsung dari service server

Redirect login tetap dipertahankan.

### 4. Studio create/edit berhenti self-fetch ke API internal

File yang dibenahi:

- `apps/web/app/studio/new/page.tsx`
- `apps/web/app/studio/works/[workId]/edit/page.tsx`

Studio tetap punya behavior yang sama:

- unauthorized → redirect ke signin
- edit work yang gagal di-load → redirect balik ke detail studio work

### 5. Service reusable baru untuk menghindari duplikasi logic page vs API

Ditambahkan:

- `apps/web/server/services/preferences/viewerPreferences.ts`
- `apps/web/server/services/taxonomy/publicTaxonomy.ts`

API route berikut sekarang reuse service yang sama, jadi kontrak API tetap hidup tanpa copy-paste logic baru:

- `/api/me/preferences`
- `/api/genres`
- `/api/warnings`
- `/api/deviant-love`

### 6. `listPublishedWorks` bisa dipakai langsung dari page server

`apps/web/server/services/works/listPublishedWorks.ts`

Ditambahkan entrypoint baru:

- `listPublishedWorksFromSearchParams(searchParams)`

Sehingga server page tidak perlu membangun HTTP request internal hanya untuk memakai logic yang sama.

## Dampak baseline statis

Setelah tahap 1, hasil scan `npm run refactor:stage0` menjadi:

- `force-dynamic` exports: **45** _(belum disentuh di tahap ini)_
- server-page import `apiJson()`: **25** _(turun dari 30)_
- total call `apiJson()` di `app/**`: **29** _(turun dari 50)_
- `cache: "no-store"`: **7** _(belum disentuh di tahap ini)_
- header `Cache-Control: no-store`: **4** _(belum disentuh di tahap ini)_
- `setInterval()`: **3** _(belum disentuh di tahap ini)_

## Delta dibanding baseline tahap 0

Perubahan statis yang paling terasa:

- server-page import `apiJson()` turun **30 → 25**
- total call `apiJson()` di `app/**` turun **50 → 29**

Artinya tahap 1 sudah memangkas sebagian besar hotspot self-fetch terbesar tanpa mengubah fitur.

## Catatan yang sengaja belum disentuh

Tahap 1 **belum** menyentuh:

- root `force-dynamic`
- strategi cache taxonomy/API
- polling unread notification
- dedupe query viewer/prefs lintas rail/home/search
- middleware surface

Itu memang ditahan untuk tahap berikutnya agar risiko regresi tetap kecil.

## Verifikasi minimum untuk tahap ini

- scan statis: `npm run refactor:stage0`
- cek manual: `docs/REGRESSION_CHECKLIST.md`

Catatan container kerja saat tahap ini dibuat:

- scan statis berhasil dijalankan
- pemasangan dependency sempat tidak stabil, jadi verifikasi penuh `npm run verify` belum bisa dikonfirmasi bersih dari container ini

## Baseline untuk tahap 2

Tahap 2 harus dimulai dari ZIP hasil tahap 1 ini, bukan dari snapshot sebelumnya.

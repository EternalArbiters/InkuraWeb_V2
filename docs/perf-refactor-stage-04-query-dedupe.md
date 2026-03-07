# Perf Refactor — Tahap 4 Query Dedupe & Batching

Tahap 4 fokus ke **mengurangi query berulang dalam request yang sama** tanpa mengubah fitur atau kontrak API.

Tahap ini dibangun langsung di atas ZIP hasil tahap 3.

## Sasaran tahap ini

Masalah yang masih tersisa setelah tahap 3:

- lookup session dan viewer prefs masih bisa kebaca berulang di server request yang sama
- halaman `/search` masih membaca viewer prefs lalu masuk ke listing work yang membaca viewer lagi
- halaman `/home` memang sudah tidak self-fetch ke API internal, tetapi untuk viewer yang login masih memicu query interaksi rail berkali-kali
- helper prefs dan helper viewer masih punya jalur query yang tumpang tindih

## Perubahan yang masuk di tahap 4

### 1. Session dan viewer lookup sekarang request-scoped cached

File:

- `apps/web/server/auth/session.ts`
- `apps/web/server/services/works/viewer.ts`
- `apps/web/server/services/preferences/viewerPreferences.ts`

Perubahan:

- `getSession()` sekarang dibungkus `react cache()`
- `getViewerBasic()` dan `getViewerWithPrefs()` sekarang memakai lookup user ter-cache per request
- `getViewerPreferences()` tidak lagi query user sendiri; sekarang memetakan hasil dari `getViewerWithPrefs()`

Dampak:

- satu request server yang butuh session + prefs + gating tidak lagi membaca user berkali-kali
- helper berbeda tetap bisa dipakai tanpa mengubah fitur, tetapi sekarang berbagi sumber data yang sama

### 2. Listing works sekarang bisa menerima viewer preloaded

File:

- `apps/web/server/services/works/listPublishedWorks.ts`

Perubahan:

- `listPublishedWorksFromSearchParams()` sekarang menerima opsi `viewer`
- caller server page bisa meneruskan viewer yang sudah dimiliki, jadi tidak perlu lookup ulang di dalam list service
- service juga menerima opsi untuk mematikan query interaksi per-list saat caller ingin melakukan batching sendiri

Dampak:

- caller seperti `/search` dan `/home` bisa menghemat satu lapis lookup viewer/prefs
- API route tetap bekerja seperti sebelumnya karena opsi ini bersifat tambahan, bukan breaking change

### 3. Rail `/home` sekarang batch viewer interactions sekali saja

File:

- `apps/web/server/services/home/getHomePageData.ts`
- `apps/web/server/services/works/viewerInteractions.ts` _(baru)_

Perubahan:

- home rails tetap mengambil 5 list work sesuai behavior lama
- tetapi flag viewer interaction (`viewerFavorited`, `viewerBookmarked`) tidak lagi dihitung per rail
- semua work id dari 5 rail dikumpulkan dulu, lalu likes + bookmarks viewer diambil **sekali batch**
- hasil batch kemudian diaplikasikan kembali ke tiap rail

Dampak:

- untuk viewer login, query interaksi home turun dari **10 query** (5 likes + 5 bookmarks) menjadi **2 query** total
- UI rail tetap menerima flag yang sama seperti sebelumnya

### 4. Halaman `/search` sekarang reuse viewer yang sama untuk filter dan hasil

File:

- `apps/web/app/search/page.tsx`

Perubahan:

- page sekarang memakai `getViewerWithPrefs()` langsung
- viewer yang sama dipakai untuk:
  - default language preference
  - unlock logic mature / deviant love
  - memanggil `listPublishedWorksFromSearchParams()`

Dampak:

- request `/search` tidak lagi memisahkan lookup prefs dan lookup viewer untuk listing
- fitur filter tetap sama

### 5. Unit test kecil ditambahkan untuk helper interaction mapping

File:

- `apps/web/tests/unit/viewer-work-interactions.spec.ts`

Perubahan:

- memastikan flag `viewerFavorited` dan `viewerBookmarked` tetap terpasang benar saat hasil batch diaplikasikan ke row work

## Dampak baseline statis

Scan statis `npm run refactor:stage0` tidak banyak berubah di tahap ini karena fokus tahap 4 adalah **dedupe query runtime**, bukan pengurangan jumlah file dynamic atau jumlah self-fetch baru.

Ekspektasi dampak utama tahap 4 ada di runtime:

- query user/session per request turun
- query interaksi rail `/home` turun tajam untuk viewer login
- request `/search` menghindari lookup viewer duplikat

## Yang sengaja belum disentuh

Tahap 4 belum menyentuh:

- work detail / reader dan jalur chapter edit yang masih punya peluang batching lain
- penambahan index DB baru lewat migration Prisma
- invalidation cache yang lebih agresif di level data publik

Itu sengaja ditahan supaya tahap ini tetap aman dan tidak memaksa migration schema.

## Verifikasi minimum

- `npm run refactor:stage0`
- cek manual `/home` saat login:
  - rail tetap muncul
  - state bookmark/favorite tetap benar
- cek manual `/search`:
  - default language tetap mengikuti prefs
  - mature/deviant filters tetap terkunci/terbuka sesuai prefs
- `docs/REGRESSION_CHECKLIST.md`

Catatan container kerja saat tahap ini dibuat:

- scan statis berhasil dijalankan
- verifikasi penuh `npm run verify` masih belum bisa dikonfirmasi bersih karena dependency workspace / Prisma CLI belum stabil di environment container ini

## Baseline untuk tahap 5

Tahap 5 harus dimulai dari ZIP hasil tahap 4 ini, bukan dari snapshot tahap 3.

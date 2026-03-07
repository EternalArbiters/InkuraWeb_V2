# Perf Refactor — Tahap 3 Background Requests & Auth Surface

Tahap 3 fokus ke dua hal yang paling terasa di billing/runtime setelah tahap 2:

1. **mengurangi request background yang terus menembak server**
2. **memindahkan proteksi route user biasa dari edge middleware ke server page yang memang butuh auth**

Tahap ini dibangun langsung di atas ZIP hasil tahap 2.

## Sasaran tahap ini

Masalah yang masih tersisa setelah tahap 2:

- unread badge navbar masih polling terus dari client
- guest user tetap bisa ikut memicu unread-count request dari navbar
- middleware masih berpotensi menjadi permukaan auth yang terlalu lebar dibanding kebutuhan sebenarnya
- beberapa page auth-heavy masih self-fetch ke API internal walau datanya bisa diambil langsung dari service server

## Perubahan yang masuk di tahap 3

### 1. Middleware dipersempit hanya untuk area admin

File:

- `apps/web/middleware.ts`

Perubahan:

- matcher sekarang tinggal `"/admin/:path*"`
- proteksi `/home`, `/library`, `/notifications`, `/settings`, dan `/studio` dipindah ke server page yang memang merender route tersebut

Dampak:

- edge request untuk area user biasa turun signifikan
- admin tetap punya short-circuit edge guard + server-side guard
- fitur auth tidak hilang, hanya boundary-nya dipindah ke tempat yang lebih hemat

### 2. Page user biasa sekarang guard auth sendiri di server

File baru:

- `apps/web/server/auth/pageAuth.ts`

File yang memakai helper ini:

- `apps/web/app/home/page.tsx`
- `apps/web/app/library/page.tsx`
- `apps/web/app/notifications/page.tsx`
- `apps/web/app/settings/history/page.tsx`
- `apps/web/app/settings/profile/page.tsx`
- `apps/web/app/studio/page.tsx`
- `apps/web/app/studio/series/page.tsx`

Dampak:

- redirect login tetap ada
- callback path tetap eksplisit di page
- route user biasa tidak perlu lagi selalu melewati edge middleware hanya untuk memastikan session

### 3. Navbar badge tidak lagi hammer server tiap 30 detik

File:

- `apps/web/app/components/NavCountBadge.tsx`
- `apps/web/app/components/navBadgeEvents.ts`
- `apps/web/app/components/dashboardNavbar/DesktopActions.tsx`
- `apps/web/app/components/MobileNav.tsx`
- `apps/web/app/notifications/NotificationsClient.tsx`
- `apps/web/app/admin-report/ui/AdminReportClient.tsx`

Perubahan:

- polling badge sekarang **visibility-aware** dan **focus-aware**
- polling period dinaikkan menjadi **90 detik** saat tab visible
- tab hidden tidak terus polling
- guest user tidak lagi memicu unread-count request untuk badge auth-only
- mark-read notif dan submit admin report sekarang memicu **event-driven refresh** badge, jadi UI tetap responsif tanpa polling agresif
- implementasi polling diubah dari `setInterval()` ke `setTimeout()` terjadwal supaya lebih mudah dihentikan saat tab hidden

Dampak:

- background request noise turun
- desktop navbar tetap menunjukkan unread count
- perubahan count setelah aksi user tetap terlihat cepat

### 4. Beberapa page auth-heavy berhenti self-fetch ke API internal

Page yang sekarang mengambil data langsung dari service server:

- `apps/web/app/library/page.tsx`
- `apps/web/app/notifications/page.tsx`
- `apps/web/app/settings/history/page.tsx`
- `apps/web/app/settings/profile/page.tsx`
- `apps/web/app/studio/page.tsx`
- `apps/web/app/studio/series/page.tsx`

Service baru/reuse yang dipakai:

- `apps/web/server/services/library/viewerLibrary.ts`
- `apps/web/server/services/notifications/viewerNotifications.ts`
- `apps/web/server/services/progress/viewerProgress.ts`
- `apps/web/server/services/profile/viewerProfile.ts`
- `apps/web/server/services/studio/works.ts` (`listStudioWorksForViewer`)

API route tetap dipertahankan, tapi sekarang route dan page berbagi logic yang sama.

## Dampak baseline statis

Setelah tahap 3, hasil scan `npm run refactor:stage0` menjadi:

- `force-dynamic` exports: **37** _(belum disentuh di tahap ini)_
- server-page import `apiJson()`: **20 → 14**
- total call `apiJson()` di `app/**`: **24 → 17**
- `fetch cache:no-store`: **7** _(belum disentuh di tahap ini)_
- `Cache-Control no-store`: **0** _(tetap)_
- `setInterval()`: **3 → 2**

Tambahan perubahan non-baseline yang penting:

- `middleware` matcher turun dari banyak prefix user route menjadi hanya **`/admin/:path*`**

## Yang sengaja belum disentuh

Tahap 3 belum menyentuh:

- work detail / reader page yang masih memakai `apiJson()`
- studio chapter detail/edit/page manager yang masih self-fetch
- dedupe session / viewer lookup lintas service
- optimasi query Prisma yang lebih dalam

Itu memang ditahan untuk tahap 4 agar risiko regresi tetap kecil.

## Verifikasi minimum

- `npm run refactor:stage0`
- cek manual unread badge saat:
  - login vs guest
  - tab visible vs hidden
  - mark notification read
  - kirim admin report
- `docs/REGRESSION_CHECKLIST.md`

Catatan container kerja saat tahap ini dibuat:

- scan statis berhasil dijalankan
- verifikasi penuh `npm run verify` masih belum bisa dikonfirmasi bersih karena dependency belum terpasang di environment container ini

## Baseline untuk tahap 4

Tahap 4 harus dimulai dari ZIP hasil tahap 3 ini, bukan dari snapshot tahap 2.

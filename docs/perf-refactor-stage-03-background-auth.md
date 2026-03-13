# Perf Refactor — Stage 3 Background Requests & Auth Surface

Stage 3 focuses on two things that most terasa in billing/runtime after stage 2:

1. **reducing request background that continuously menembak server**
2. **moving proteksi route regular user from edge middleware to server page that memang butuh auth**

This stage dibangun directly in atas ZIP hasil stage 2.

## Sasaran stage this

Masalah that still remaining after stage 2:

- unread badge navbar still polling continuously from client
- guest user still can also trigger unread-count request from navbar
- middleware still berpotensi become permukaan auth that terthen lebar dibanding kebutuhan actually
- several page auth-heavy still self-fetch to API internal walau datanya can diambil directly from service server

## Perubahan that enter in stage 3

### 1. Middleware dipersempit only for area admin

File:

- `apps/web/middleware.ts`

Perubahan:

- matcher now stay `"/admin/:path*"`
- proteksi `/home`, `/library`, `/notifications`, `/settings`, and `/studio` moved to server page that memang merender route that

Dampak:

- edge request for area regular user reduced signifikan
- admin still punya short-circuit edge guard + server-side guard
- features auth not lost, only boundary-nya moved to tempat that more hemat

### 2. Page regular user now guard auth sendiri in server

File new:

- `apps/web/server/auth/pageAuth.ts`

File that uses helper this:

- `apps/web/app/home/page.tsx`
- `apps/web/app/library/page.tsx`
- `apps/web/app/notifications/page.tsx`
- `apps/web/app/settings/history/page.tsx`
- `apps/web/app/settings/profile/page.tsx`
- `apps/web/app/studio/page.tsx`
- `apps/web/app/studio/series/page.tsx`

Dampak:

- redirect login still there is
- callback path still eksplcontentt in page
- route regular user not need lagi sethen methroughi edge middleware only to ensure session

### 3. Navbar badge not lagi hammer server tiap 30 detik

File:

- `apps/web/app/components/NavCountBadge.tsx`
- `apps/web/app/components/navBadgeEvents.ts`
- `apps/web/app/components/dashboardNavbar/DesktopActions.tsx`
- `apps/web/app/components/MobileNav.tsx`
- `apps/web/app/notifications/NotificationsClient.tsx`
- `apps/web/app/admin-report/ui/AdminReportClient.tsx`

Perubahan:

- polling badge now **vcontentbility-aware** and **focus-aware**
- polling period dinaikkan become **90 detik** when tab vcontentble
- tab hidden not continuously polling
- guest user not lagi trigger unread-count request for badge auth-only
- mark-read notif and submit admin report now trigger **event-driven refresh** badge, become UI still responsif without polling agresif
- implementasi polling changed from `setInterval()` to `setTimeout()` terjadwal so that more easy dihentikan when tab hidden

Dampak:

- background request noise reduced
- desktop navbar still point tokan unread count
- perubahan count after aksi user still terlihat cepat

### 4. Beberapa page auth-heavy berhenti self-fetch to API internal

Page current fetches data directly from service server:

- `apps/web/app/library/page.tsx`
- `apps/web/app/notifications/page.tsx`
- `apps/web/app/settings/history/page.tsx`
- `apps/web/app/settings/profile/page.tsx`
- `apps/web/app/studio/page.tsx`
- `apps/web/app/studio/series/page.tsx`

Service new/reuse used:

- `apps/web/server/services/library/viewerLibrary.ts`
- `apps/web/server/services/notifications/viewerNotifications.ts`
- `apps/web/server/services/progress/viewerProgress.ts`
- `apps/web/server/services/profile/viewerProfile.ts`
- `apps/web/server/services/studio/works.ts` (`listStudioWorksForViewer`)

API route still kept, tapi now route and page berbagi logic same.

## Dampak baseline statis

Setelah stage 3, hasil scan `npm run refactor:stage0` become:

- `force-dynamic` exports: **37** _(not yet touched in stage this)_
- server-page import `apiJson()`: **20 → 14**
- total call `apiJson()` in `app/**`: **24 → 17**
- `fetch cache:no-store`: **7** _(not yet touched in stage this)_
- `Cache-Control no-store`: **0** _(still)_
- `setInterval()`: **3 → 2**

Tambahan perubahan non-baseline that penting:

- `middleware` matcher reduced from many prefix user route become only **`/admin/:path*`**

## Intentionally not touched yet

Stage 3 not yet touch:

- work detail / reader page that still uses `apiJson()`
- studio chapter detail/edit/page manager that still self-fetch
- dedupe session / viewer lookup lintas service
- optimasi query Prisma that more dalam

Itu memang held for stage 4 so that rcontentko regression still small.

## Verifikasi minimum

- `npm run refactor:stage0`
- check manual unread badge when:
  - login vs guest
  - tab vcontentble vs hidden
  - mark notification read
  - kirim admin report
- `docs/REGRESSION_CHECKLIST.md`

Container work notes when this stage was created:

- the static scan ran successfully
- A full `npm run verify` still could not be confirmed as clean because dependencies were not yet available in this container environment.

## Baseline for stage 4

Stage 4 must dimulai from ZIP hasil stage 3 this, not from snapshot stage 2.

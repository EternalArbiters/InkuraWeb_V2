# Perf refactor stage 07 — hydration preload and dynamic cleanup

Stage 7 fokus ke dua hal yang masih tersisa setelah stage 6:

1. Mengurangi request tambahan setelah hydration untuk halaman detail work dan reader.
2. Menghapus `force-dynamic` yang redundan pada page wrapper yang tidak membutuhkannya secara eksplisit.

Prinsip yang tetap dijaga:
- tidak menghilangkan fitur
- API route tetap dipertahankan
- state interaktif client tetap berjalan setelah page tampil

## Perubahan utama

### 1. Preload review di work detail

Sebelum stage 7, `ReviewSection` selalu melakukan fetch ke:
- `/api/works/[workId]/reviews`

setelah hydration, walaupun halaman work sudah dirender dari server.

Sekarang server page `/w/[slug]` memuat review awal langsung lewat service server:
- `server/services/reviews/listWorkReviews.ts`

Lalu hasil awal dipassing ke:
- `app/components/work/ReviewSection.tsx`
- `app/components/work/reviews/useReviews.ts`

Dampak:
- halaman detail work tidak wajib memicu request review tambahan saat pertama kali dibuka
- refresh interaktif setelah submit/edit/delete tetap memakai endpoint API yang sama

### 2. Preload comment di work detail dan reader

Sebelum stage 7, `CommentSection` selalu fetch ke `/api/comments` saat mount.

Sekarang data comment awal dimuat di server untuk:
- `/w/[slug]`
- `/w/[slug]/read/[chapterId]`
- `/w/[slug]/read/[chapterId]/comments`

Service yang dipakai:
- `server/services/comments/fetchComments.ts`

Hook client sekarang bisa menerima seed data awal:
- `app/components/work/comments/useComments.ts`

Dampak:
- work detail tidak lagi wajib memicu request comment agregat saat mount
- reader mobile/desktop tidak lagi wajib memicu request comment preview terpisah saat mount
- halaman komentar chapter penuh juga bisa tampil dengan data awal dari server
- aksi reply/edit/like/dislike tetap memakai endpoint API yang sama

### 3. Reuse logic review API ke service server

GET route review sekarang memakai service yang sama dengan server page:
- `server/services/reviews/listWorkReviews.ts`
- `server/services/api/works/[workId]/reviews/route.ts`

Hasilnya:
- logic gating dan sorting review tidak terduplikasi
- page server dan API memakai kontrak data yang sama

### 4. Dynamic cleanup yang aman

`force-dynamic` dihapus dari page wrapper yang tidak perlu memaksakan dynamic secara eksplisit:
- `app/admin/notify/page.tsx`
- `app/browse/latest-translations/page.tsx`
- `app/browse/new-originals/page.tsx`
- `app/browse/recent-updates/page.tsx`
- `app/browse/trending-comics/page.tsx`
- `app/browse/trending-novels/page.tsx`
- `app/work/[workId]/page.tsx`
- `app/read/comic/[workId]/[chapterId]/page.tsx`
- `app/read/novel/[workId]/[chapterId]/page.tsx`

Catatan:
- beberapa route tetap akan menjadi dynamic secara otomatis bila child/service membaca session/cookies
- tujuan perubahan ini adalah menghapus pemaksaan yang redundan, bukan mengubah fitur auth/gating

## File penting yang berubah

- `apps/web/app/w/[slug]/page.tsx`
- `apps/web/app/w/[slug]/read/[chapterId]/page.tsx`
- `apps/web/app/w/[slug]/read/[chapterId]/comments/page.tsx`
- `apps/web/app/components/work/CommentSection.tsx`
- `apps/web/app/components/work/comments/useComments.ts`
- `apps/web/app/components/work/ReviewSection.tsx`
- `apps/web/app/components/work/reviews/useReviews.ts`
- `apps/web/server/services/comments/fetchComments.ts`
- `apps/web/server/services/reviews/listWorkReviews.ts`
- `apps/web/server/services/api/works/[workId]/reviews/route.ts`

## Expected effect

Stage 7 tidak terutama menurunkan jumlah query DB total; yang diturunkan adalah:
- request tambahan browser setelah hydration
- function invocation tambahan untuk fetch review/comment awal
- latency UI awal sebelum review/comment muncul

## Catatan verifikasi

Yang bisa diverifikasi di environment kerja ini:
- scanner baseline statis berjalan
- hotspot `force-dynamic` turun
- page detail/reader sudah membawa seed data awal ke komponen client

Yang belum bisa diklaim penuh di environment ini:
- `npm run verify` end-to-end
- typecheck final bila dependency/type workspace belum terpasang lengkap

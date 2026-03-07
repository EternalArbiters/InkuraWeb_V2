# Perf refactor stage 05 — public detail and reading-list fan-out

Tahap 5 fokus menutup sisa self-fetch server page di jalur publik yang sering dibuka user:

- detail work `/w/[slug]`
- daftar chapter `/w/[slug]/chapters`
- reader chapter `/w/[slug]/read/[chapterId]`
- halaman komentar reader `/w/[slug]/read/[chapterId]/comments`
- reading list pribadi `/lists`
- reading list publik `/lists/[slug]`
- redirect legacy `/work/[workId]`, `/read/novel/[workId]/[chapterId]`, `/read/comic/[workId]/[chapterId]`

## Masalah sebelum tahap 5

Walaupun tahap 1–4 sudah memangkas banyak fan-out, halaman publik paling penting masih melakukan pola ini:

`server page -> fetch /api/... -> route handler -> service/db`

Dampaknya:

- satu page render tetap menghasilkan invocation tambahan
- redirect legacy ikut memukul function internal hanya untuk mencari slug
- detail work dan reader menduplikasi boundary HTTP internal padahal sudah ada service server-only yang cocok untuk dipakai langsung

## Perubahan utama

### 1. Service lookup slug work

Ditambahkan:

- `apps/web/server/services/works/workSlug.ts`

Service ini dipakai ulang oleh:

- legacy redirect pages
- API `/api/works/[workId]`

### 2. Service detail work publik

Ditambahkan:

- `apps/web/server/services/works/workPage.ts`

Service ini memindahkan logika detail work ke reusable server service:

- lookup work by slug
- gating mature / deviant love
- visibility chapter
- viewer interactions (like, bookmark, rating)
- reading progress
- previous / next arc derivation
- thumbnail fallback chapter

Dipakai oleh:

- `app/w/[slug]/page.tsx`
- `app/w/[slug]/chapters/page.tsx`
- API `/api/works/slug/[slug]`

### 3. Service reader chapter publik

Ditambahkan:

- `apps/web/server/services/chapters/readChapter.ts`

Service ini memusatkan:

- lookup chapter + work
- gating chapter/work
- chapter like viewer
- payload reader untuk work/chapter

Dipakai oleh:

- `app/w/[slug]/read/[chapterId]/page.tsx`
- `app/w/[slug]/read/[chapterId]/comments/page.tsx`
- API `/api/chapters/[chapterId]`

### 4. Service reading list

Ditambahkan:

- `apps/web/server/services/readingLists/readingLists.ts`

Service ini memusatkan:

- list reading list milik viewer
- reading list publik/private by slug
- filtering item yang tetap menghormati gate mature / deviant love

Dipakai oleh:

- `app/lists/page.tsx`
- `app/lists/[slug]/page.tsx`
- API `/api/lists`
- API `/api/lists/public/[slug]`

## Kenapa ini aman

- fitur tidak dihapus
- API route tetap dipertahankan untuk client-side behavior yang masih memerlukannya
- server page hanya berhenti memutar request lewat HTTP internal untuk data yang sama
- shape payload tetap dijaga agar UI tidak berubah

## Dampak yang ditargetkan

Tahap 5 menurunkan invocation pada jalur publik paling sering dibuka, terutama:

- open work detail
- open reader
- open reading list
- redirect dari route legacy ke slug route baru

Secara statis, hasil baseline berubah dari:

- server-page import `apiJson()`: `14 -> 5`
- total call `apiJson()` di `app/**`: `17 -> 8`

Sisa hotspot `apiJson()` setelah tahap ini tinggal area:

- admin reports
- studio work detail
- studio chapter create/edit/pages

Artinya sisa fan-out terbesar sekarang sudah terkonsentrasi di surface creator/admin, bukan lagi di public reader flow.

## File baru

- `apps/web/server/services/works/workSlug.ts`
- `apps/web/server/services/works/workPage.ts`
- `apps/web/server/services/chapters/readChapter.ts`
- `apps/web/server/services/readingLists/readingLists.ts`

## File yang diubah

- `apps/web/app/w/[slug]/page.tsx`
- `apps/web/app/w/[slug]/chapters/page.tsx`
- `apps/web/app/w/[slug]/read/[chapterId]/page.tsx`
- `apps/web/app/w/[slug]/read/[chapterId]/comments/page.tsx`
- `apps/web/app/lists/page.tsx`
- `apps/web/app/lists/[slug]/page.tsx`
- `apps/web/app/work/[workId]/page.tsx`
- `apps/web/app/read/novel/[workId]/[chapterId]/page.tsx`
- `apps/web/app/read/comic/[workId]/[chapterId]/page.tsx`
- `apps/web/server/services/api/works/[workId]/route.ts`
- `apps/web/server/services/api/works/slug/[slug]/route.ts`
- `apps/web/server/services/api/chapters/[chapterId]/route.ts`
- `apps/web/server/services/api/lists/route.ts`
- `apps/web/server/services/api/lists/public/[slug]/route.ts`

## Catatan verifikasi

Verifikasi minimum yang berhasil dijalankan di environment kerja ini:

- `node apps/web/scripts/refactor-stage0-baseline.js`

Environment container ini masih belum stabil untuk `npm install` / Prisma / type packages penuh, jadi tahap ini belum mengklaim `npm run verify` pass penuh.

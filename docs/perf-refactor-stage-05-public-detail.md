# Perf refactor stage 05 — public detail and reading-list fan-out

Tahap 5 fokus menutup sisa self-fetch server page in jflow public that sering dibuka user:

- detail work `/w/[slug]`
- chapter list `/w/[slug]/chapters`
- reader chapter `/w/[slug]/read/[chapterId]`
- page comments reader `/w/[slug]/read/[chapterId]/comments`
- reading list private `/lists`
- reading list public `/lists/[slug]`
- redirect legacy `/work/[workId]`, `/read/novel/[workId]/[chapterId]`, `/read/comic/[workId]/[chapterId]`

## Masalah before stage 5

Walaupun stage 1–4 already memangkas banyak fan-out, page public paling penting still melakukan pola this:

`server page -> fetch /api/... -> route handler -> service/db`

Dampaknya:

- satu page render still menghasilkan invocation additional
- redirect legacy ikut memukul function internal only for mencari slug
- detail work and reader menduplikasi boundary HTTP internal padathing already there is service server-only that suitable for direct use

## Perubahan main

### 1. Service lookup slug work

Ditambahkan:

- `apps/web/server/services/works/workSlug.ts`

This service is reused by:

- legacy redirect pages
- API `/api/works/[workId]`

### 2. Service detail work public

Ditambahkan:

- `apps/web/server/services/works/workPage.ts`

Service this memindahkan logika detail work to reusable server service:

- lookup work by slug
- gating mature / deviant love
- vcontentbility chapter
- viewer interactions (like, bookmark, rating)
- reading progress
- previous / next arc derivation
- thumbnail fallback chapter

Used by:

- `app/w/[slug]/page.tsx`
- `app/w/[slug]/chapters/page.tsx`
- API `/api/works/slug/[slug]`

### 3. Service reader chapter public

Ditambahkan:

- `apps/web/server/services/chapters/readChapter.ts`

Service this memusatkan:

- lookup chapter + work
- gating chapter/work
- chapter like viewer
- payload reader for work/chapter

Used by:

- `app/w/[slug]/read/[chapterId]/page.tsx`
- `app/w/[slug]/read/[chapterId]/comments/page.tsx`
- API `/api/chapters/[chapterId]`

### 4. Service reading list

Ditambahkan:

- `apps/web/server/services/readingLists/readingLists.ts`

Service this memusatkan:

- list reading list milik viewer
- reading list public/private by slug
- filtering item that still menghormati gate mature / deviant love

Used by:

- `app/lists/page.tsx`
- `app/lists/[slug]/page.tsx`
- API `/api/lists`
- API `/api/lists/public/[slug]`

## Kenapa this safe

- features not dihapus
- API route is still kept for client-side behavior that still memerlukannya
- the server page stops routing requests through internal HTTP for the same data
- shape payload still dijaga so that UI not berubah

## Dampak that ditargetkan

Tahap 5 menurunkan invocation pada jflow public most frequently opened, especially:

- open work detail
- open reader
- open reading list
- redirect from route legacy to slug route new

Secara statis, hasil baseline berubah from:

- server-page import `apiJson()`: `14 -> 5`
- total call `apiJson()` in `app/**`: `17 -> 8`

Sisa hotspot `apiJson()` after stage this tinggal area:

- admin reports
- studio work detail
- studio chapter create/edit/pages

Artinya sisa fan-out terbesar now already terkonsentrasi in surface creator/admin, no longer in the public reader flow.

## File new

- `apps/web/server/services/works/workSlug.ts`
- `apps/web/server/services/works/workPage.ts`
- `apps/web/server/services/chapters/readChapter.ts`
- `apps/web/server/services/readingLists/readingLists.ts`

## File that diubah

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

Minimum verification that was successfully run in this working environment:

- `node apps/web/scripts/refactor-stage0-baseline.js`

Environment container this still not yet stabil for `npm install` / Prisma / type packages penuh, become stage this not yet mengklaim `npm run verify` pass penuh.

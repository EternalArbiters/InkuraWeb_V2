# Perf refactor stage 06 — creator/admin surface and final page fan-out cleanup

Tahap 6 menutup sisa self-fetch server page di surface creator/admin yang masih tersisa setelah tahap 5:

- studio work detail `/studio/works/[workId]`
- new chapter `/studio/works/[workId]/chapters/new`
- edit chapter `/studio/works/[workId]/chapters/[chapterId]/edit`
- comic pages manager `/studio/works/[workId]/chapters/[chapterId]/pages`
- admin reports `/admin/reports`

## Masalah sebelum tahap 6

Sisa hotspot `apiJson()` memang sudah tinggal sedikit, tetapi semuanya ada di area yang relatif berat:

- studio work detail membaca work + chapters milik creator
- chapter edit/pages membaca chapter + work + warnings
- admin reports membaca report + comment + work/chapter target

Sebelum tahap ini, alurnya masih:

`server page -> fetch /api/... -> route handler -> service/db`

Artinya surface creator/admin tetap menghasilkan invocation tambahan walaupun semua data aslinya sudah tersedia di service server-only.

## Perubahan utama

### 1. Studio pages pakai service langsung

Server page berikut berhenti self-fetch ke API internal:

- `app/studio/works/[workId]/page.tsx`
- `app/studio/works/[workId]/chapters/new/page.tsx`
- `app/studio/works/[workId]/chapters/[chapterId]/edit/page.tsx`
- `app/studio/works/[workId]/chapters/[chapterId]/pages/page.tsx`

Service yang dipakai ulang:

- `server/services/studio/workById.ts`
- `server/services/studio/chapters.ts`
- `server/services/taxonomy/publicTaxonomy.ts`

Behavior redirect lama tetap dijaga:

- studio work / new chapter tetap fallback ke `/studio`
- chapter edit/pages tetap membedakan `401 -> signin`, `403 -> back ke work`, `404 -> notFound`

### 2. Admin reports dipindah ke reusable service

Ditambahkan:

- `apps/web/server/services/admin/reports.ts`

Service ini memusatkan query report terbuka, lookup comment target, dan hydrasi target work/chapter. Dipakai ulang oleh:

- `app/admin/reports/page.tsx`
- `server/services/api/admin/reports/route.ts`

Jadi page admin tidak lagi memutar request lewat `/api/admin/reports` hanya untuk membaca data yang sama.

## Kenapa ini aman

- tidak ada fitur yang dihapus
- API route tetap dipertahankan untuk client-side calls dan kompatibilitas
- yang berubah hanya jalur data server page: langsung ke service, bukan lewat HTTP internal
- redirect behavior lama dipertahankan agar UX tetap konsisten

## Dampak yang ditargetkan

Tahap 6 menyelesaikan sisa fan-out server page yang tersisa dari tahap 5.

Perubahan statis yang paling penting:

- server-page import `apiJson()`: `5 -> 0`
- call `apiJson()` di `app/**` yang tersisa dari page/component server: `8 -> 0` untuk page code yang nyata

Catatan baseline scanner:

- output scanner masih bisa menampilkan `apiJson calls inside app/: 1`
- itu berasal dari file helper `server/http/apiJson.ts`, bukan dari page app yang masih self-fetch
- pengecekan langsung `rg` pada `apps/web/app/**` sekarang menunjukkan `0` pemanggilan `apiJson()`

## File baru

- `apps/web/server/services/admin/reports.ts`
- `docs/perf-refactor-stage-06-creator-admin.md`

## File yang diubah

- `apps/web/app/studio/works/[workId]/page.tsx`
- `apps/web/app/studio/works/[workId]/chapters/new/page.tsx`
- `apps/web/app/studio/works/[workId]/chapters/[chapterId]/edit/page.tsx`
- `apps/web/app/studio/works/[workId]/chapters/[chapterId]/pages/page.tsx`
- `apps/web/app/admin/reports/page.tsx`
- `apps/web/server/services/api/admin/reports/route.ts`

## Catatan verifikasi

Verifikasi minimum yang berhasil dijalankan di environment kerja ini:

- `node apps/web/scripts/refactor-stage0-baseline.js`
- `tsc --noEmit -p apps/web/tsconfig.json`
  - masih gagal karena environment ini tidak menyediakan type definition `next-auth`
  - kegagalannya tidak menunjukkan error baru spesifik dari edit tahap 6

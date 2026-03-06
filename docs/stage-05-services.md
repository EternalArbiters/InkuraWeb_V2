# Stage 05 — Service Layer (Business Logic)

Tujuan tahap ini: **memindahkan “business logic” keluar dari API route handler** supaya route jadi tipis (orchestration), sementara rules + transaksi + query kompleks terkumpul di `server/services/**`.

> Prinsip: *tanpa mengubah behavior/fitur*, hanya merapikan struktur.

## Struktur baru

Lokasi utama:

- `apps/web/server/services/works/*`
  - `listPublishedWorks.ts` — logika utama GET `/api/works` (filtering, gating, sort, pagination, viewer flags)
  - `viewer.ts` — helper ambil viewer + preferences
  - `gating.ts` — helper gating mature/deviant (dipakai bertahap)

- `apps/web/server/services/comments/*`
  - `fetchComments.ts` — logika GET `/api/comments`
  - `createComment.ts` — logika POST `/api/comments` (+ best-effort notify)
  - `mutations.ts` — edit/hapus, like/dislike, pin, hide
  - `tree.ts` — builder tree + sorting root pinned/top/newest, dll
  - `moderation.ts` — author/admin moderation check (WORK/CHAPTER)

- `apps/web/server/services/studio/*`
  - `works.ts` — listing studio works + create work (multipart)
  - `workById.ts` — GET/PATCH/DELETE `/api/studio/works/[workId]`
  - `chapters.ts` — create chapter + GET/PATCH chapter editor
  - `chapterPages.ts` — upload/replace pages untuk comic chapter
  - `session.ts`, `creator.ts` — helper auth/role/permission

## Route yang dibuat tipis

- `GET /api/works` → `server/services/works/listPublishedWorks.ts`
- `GET/POST /api/comments` → `server/services/comments/*`
- `PATCH/DELETE /api/comments/[commentId]` → `server/services/comments/mutations.ts`
- `POST /api/comments/[commentId]/like|dislike|pin|hide` → `server/services/comments/mutations.ts`
- `GET/POST /api/studio/works` → `server/services/studio/works.ts`
- `GET/PATCH/DELETE /api/studio/works/[workId]` → `server/services/studio/workById.ts`
- `POST /api/studio/chapters` → `server/services/studio/chapters.ts`
- `GET/PATCH /api/studio/chapters/[chapterId]` → `server/services/studio/chapters.ts`
- `POST /api/studio/chapters/[chapterId]/pages` → `server/services/studio/chapterPages.ts`

## Catatan kompatibilitas

- Response shape dan status code dipertahankan semirip mungkin dengan stage sebelumnya.
- Side-effect notifications untuk comment/pin/new chapter tetap **best-effort** (error tidak menggagalkan request utama).



## Cakupan penuh route API

Pada tahap lanjutan ini, seluruh file `app/api/**/route.ts` non-NextAuth sudah ditipiskan menjadi delegator yang memanggil handler di `apps/web/server/services/api/**/route.ts`.

Artinya:

- route file hanya memegang `runtime` dan `apiRoute(...)` wrapper
- business logic route dipindahkan ke service-backed handlers
- domain services lama seperti `works/*`, `comments/*`, dan `studio/*` tetap dipakai di bawah layer ini

Tujuannya bukan menambah fitur baru, tetapi memastikan **100% route domain sudah service-backed** dan konsisten secara struktur.

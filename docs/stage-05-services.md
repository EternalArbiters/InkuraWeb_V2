# Stage 05 — Service Layer (Business Logic)

Tujuan stage this: **memindahkan “business logic” exit from API route handler** so that route become tipis (orchestration), sementara rules + transaksi + query kompleks terkumpul in `server/services/**`.

> Prinsip: *without mengubah behavior/features*, only clean up structure.

## Struktur new

Lokasi main:

- `apps/web/server/services/works/*`
  - `listPublishedWorks.ts` — logika main GET `/api/works` (filtering, gating, sort, pagination, viewer flags)
  - `viewer.ts` — helper ambil viewer + preferences
  - `gating.ts` — helper gating mature/deviant (used bertahap)

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
  - `chapterPages.ts` — upload/replace pages for comic chapter
  - `session.ts`, `creator.ts` — helper auth/role/permission

## Route that dibuat tipis

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

- Response shape and status code kept semirip mungkin with stage beforenya.
- Side-effect notifications for comment/pin/new chapter still **best-effort** (error not mengfailedkan request main).


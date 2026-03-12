# Stage 7 — Data access & performa (rapih + stabil)

Target stage this: **without change perilaku features**, tapi query Prisma become more consistent, payload more predictable, and refactor berikutnya not tersandung copy‑paste include/select that beda‑beda.

## Perubahan main

### 1) Prisma select/include presets

Ditambah:

- `apps/web/server/db/selectors.ts`

Isinya preset `select/include` that sering used, misalnya:

- `workCardSelect` → for list card work (browse/search/home)
- `commentListInclude` → include user + attachments(media) for comments
- `notificationSelect` → field notifications that consistent
- leaf presets: `userPublicSelect`, `userNameSelect`, `nameSlugSelect`, dll.

Tujuannya:

- reducing duplikasi `select: { ... }` in banyak file
- memudahkan audit payload (if mau nambah/hapus field, cukup in 1 tempat)

### 2) Pagination helper (offset + cursor)

Ditambah:

- `apps/web/server/db/pagination.ts`

Helper:

- `parseTake`, `parseSkip`, `parseCursor`
- `nextCursorFromRows`

Note:

- **Tidak memaksa UI berubah**.
- Endpoint already use offset (`skip/take`) still jalan.
- Endpoint can opt‑in cursor (`cursor/take`) for list that more stabil.

### 3) Works list endpoint: cursor-ready + select preset

Di-refactor:

- `apps/web/server/services/works/listPublishedWorks.ts`

Perubahan:

- memakai `workCardSelect`
- orderBy dibuat deterministic (ditambah tie-breaker `id`)
- optional cursor pagination via query param `cursor`
- response ditambah `nextCursor` (not mengganggu client old)

### 4) Notifications endpoint: select preset + cursor-ready

Di-refactor:

- `apps/web/app/api/notifications/route.ts`

Perubahan:

- memakai `notificationSelect`
- optional `take` (default 20, max 50)
- optional `cursor`
- response ditambah `nextCursor`

### 5) Comments: include preset

Beberapa tempat that beforenya copy‑paste include now memakai `commentListInclude`.

## Index & perf hygiene (Prisma)

Ditambah index safe and relevant with query that sering used:

- Work browsing:
  - `@@index([status, updatedAt])`
  - `@@index([status, likeCount])`
- Notifications:
  - `@@index([userId, isRead, createdAt])`

Perubahan schema:

- `apps/web/prisma/schema.prisma`

Migration additional:

- `apps/web/prisma/migrations/20260305000000_stage7_perf_indexes/migration.sql`

> Migration memakai `CREATE INDEX IF NOT EXISTS` so that safer if index already dibuat manual in environment tertentu.

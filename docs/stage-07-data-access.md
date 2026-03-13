# Stage 7 — Data access & performa (rapih + stable)

Target stage this: **without change perilaku features**, tapi query Prisma become more consistent, payload more predictable, and refactor next not tersandung copy‑paste include/select that beda‑beda.

## Perubahan main

### 1) Prisma select/include presets

Ditambah:

- `apps/web/server/db/selectors.ts`

Isinya preset `select/include` that often used, misalnya:

- `workCardSelect` → for list card work (browse/search/home)
- `commentListInclude` → include user + attachments(media) for comments
- `notificationSelect` → field notifications that consistent
- leaf presets: `userPublicSelect`, `userNameSelect`, `nameSlugSelect`, etc.

Tujuannya:

- reducing duplikasi `select: { ... }` in many file
- memudahkan audit payload (if want nambah/delete field, enough in 1 tempat)

### 2) Pagination helper (offset + cursor)

Ditambah:

- `apps/web/server/db/pagination.ts`

Helper:

- `parseTake`, `parseSkip`, `parseCursor`
- `nextCursorFromRows`

Note:

- **This does not force the UI to change**.
- Endpoint already use offset (`skip/take`) still jalan.
- Endpoint can opt‑in cursor (`cursor/take`) for list that more stable.

### 3) Works list endpoint: cursor-ready + select preset

Di-refactor:

- `apps/web/server/services/works/listPublishedWorks.ts`

Perubahan:

- uses `workCardSelect`
- orderBy created deterministic (ditambah tie-breaker `id`)
- optional cursor pagination via query param `cursor`
- response ditambah `nextCursor` (not mengganggu client old)

### 4) Notifications endpoint: select preset + cursor-ready

Di-refactor:

- `apps/web/app/api/notifications/route.ts`

Perubahan:

- uses `notificationSelect`
- optional `take` (default 20, max 50)
- optional `cursor`
- response ditambah `nextCursor`

### 5) Comments: include preset

Beberapa tempat that previously copy‑paste include now uses `commentListInclude`.

## Index & perf hygiene (Prisma)

Ditambah index safe and relevant with query that often used:

- Work browsing:
  - `@@index([status, updatedAt])`
  - `@@index([status, likeCount])`
- Notifications:
  - `@@index([userId, isRead, createdAt])`

Perubahan schema:

- `apps/web/prisma/schema.prisma`

Migration additional:

- `apps/web/prisma/migrations/20260305000000_stage7_perf_indexes/migration.sql`

> Migration uses `CREATE INDEX IF NOT EXISTS` so that safer if index already created manual in environment tertentu.

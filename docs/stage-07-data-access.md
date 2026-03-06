# Stage 7 — Data access & performa (rapih + stabil)

Target tahap ini: **tanpa ubah perilaku fitur**, tapi query Prisma jadi lebih konsisten, payload lebih predictable, dan refactor berikutnya tidak tersandung copy‑paste include/select yang beda‑beda.

## Perubahan utama

### 1) Prisma select/include presets

Ditambah:

- `apps/web/server/db/selectors.ts`

Isinya preset `select/include` yang sering dipakai, misalnya:

- `workCardSelect` → untuk list card work (browse/search/home)
- `commentListInclude` → include user + attachments(media) untuk comments
- `notificationSelect` → field notifications yang konsisten
- leaf presets: `userPublicSelect`, `userNameSelect`, `nameSlugSelect`, dll.

Tujuannya:

- mengurangi duplikasi `select: { ... }` di banyak file
- memudahkan audit payload (kalau mau nambah/hapus field, cukup di 1 tempat)

### 2) Pagination helper (offset + cursor)

Ditambah:

- `apps/web/server/db/pagination.ts`

Helper:

- `parseTake`, `parseSkip`, `parseCursor`
- `nextCursorFromRows`

Catatan:

- **Tidak memaksa UI berubah**.
- Endpoint yang sudah pakai offset (`skip/take`) tetap jalan.
- Endpoint bisa opt‑in cursor (`cursor/take`) untuk list yang lebih stabil.

### 3) Works list endpoint: cursor-ready + select preset

Di-refactor:

- `apps/web/server/services/works/listPublishedWorks.ts`

Perubahan:

- memakai `workCardSelect`
- orderBy dibuat deterministic (ditambah tie-breaker `id`)
- optional cursor pagination via query param `cursor`
- response ditambah `nextCursor` (tidak mengganggu client lama)

### 4) Notifications endpoint: select preset + cursor-ready

Di-refactor:

- `apps/web/app/api/notifications/route.ts`

Perubahan:

- memakai `notificationSelect`
- optional `take` (default 20, max 50)
- optional `cursor`
- response ditambah `nextCursor`

### 5) Comments: include preset

Beberapa tempat yang sebelumnya copy‑paste include sekarang memakai `commentListInclude`.

## Index & perf hygiene (Prisma)

Ditambah index yang aman dan relevan dengan query yang sering dipakai:

- Work browsing:
  - `@@index([status, updatedAt])`
  - `@@index([status, likeCount])`
- Notifications:
  - `@@index([userId, isRead, createdAt])`

Perubahan schema:

- `apps/web/prisma/schema.prisma`

Migration tambahan:

- `apps/web/prisma/migrations/20260305000000_stage7_perf_indexes/migration.sql`

> Migration memakai `CREATE INDEX IF NOT EXISTS` supaya lebih aman jika index sudah dibuat manual di environment tertentu.

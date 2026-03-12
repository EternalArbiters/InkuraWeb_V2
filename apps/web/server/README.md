# `apps/web/server/*`

Folder this bercontent **server-only modules**.

Aturan:

- Do not import modules here from client components (`"use client"`).
- Tambahkan `import "server-only";` in setiap file server-only.
- For helper that use browser APIs, letakkan in `lib/*` or `hooks/*` and beri marker `import "client-only";`.

Subfolder main:

- `auth/` — NextAuth config, session helpers, require user/admin
- `db/` — Prisma client singleton
- `cache/` — DB read cache (tag-based revalidation)
- `http/` — helper fetch server-side (forward cookies)
- `services/` — business logic (mis. notifications)
- `storage/` — Cloudflare R2 helpers
- `uploads/` — server-side upload helpers

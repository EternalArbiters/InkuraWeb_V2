# `apps/web/server/*`

Folder ini berisi **server-only modules**.

Aturan:

- Jangan import modul di sini dari komponen client (`"use client"`).
- Tambahkan `import "server-only";` di setiap file server-only.
- Untuk helper yang pakai browser APIs, letakkan di `lib/*` atau `hooks/*` dan beri marker `import "client-only";`.

Subfolder utama:

- `auth/` — NextAuth config, session helpers, require user/admin
- `db/` — Prisma client singleton
- `cache/` — DB read cache (tag-based revalidation)
- `http/` — helper fetch server-side (forward cookies)
- `services/` — business logic (mis. notifications)
- `storage/` — Cloudflare R2 helpers
- `uploads/` — server-side upload helpers

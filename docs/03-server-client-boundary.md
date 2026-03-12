# Server vs Client boundary (Stage 3)

Tujuan stage this: repo **more rapi secara structure** with batas that clear antara:

- **Server-only code** (Prisma, NextAuth server session, Cloudflare R2, Resend email, crypto/bcrypt, Next headers/cookies)
- **Client-only code** (browser APIs seperti `window`, `localStorage`, `crypto.subtle`, presigned upload via fetch browser)

## Aturan praktis

### 1) Server-only code must hidup in `apps/web/server/**`

Example:

- `server/db/*` → Prisma
- `server/auth/*` → NextAuth options, requireUser/admin checks
- `server/storage/*` → R2 (S3-compatible)
- `server/uploads/*` → helper upload server-side
- `server/http/*` → helper fetch server-side (forward cookies)
- `server/services/*` → business logic (notifications, dll)

Semua file server-only **required** punya `import "server-only";` in baris paling atas.

### 2) Client-only helpers must ditandai `import "client-only";`

Ini mencegah client helper not intentionally in-import from server component / route handler.

Example already ditandai:

- `apps/web/lib/commentMediaClient.ts`
- `apps/web/lib/r2UploadClient.ts`
- `apps/web/hooks/useAuthModal.ts`

### 3) Folder `apps/web/lib/**` for kode safe used in mana pun

`lib/` should bercontent thing-thing seperti:

- catalog statis (`genreCatalog`, `warningCatalog`, dll)
- util pure (`slugify`, `time`, `utils`)
- helper client (still may, tapi required `client-only` if use browser API)

If sebuah modul butuh Prisma/R2/headers/cookies/bcrypt, **pindahkan to `server/`**.

## Checklist before merge

1) Tidak there is import Prisma/NextAuth server session/R2 from komponen client (`"use client"`).
2) Tidak there is modul `server/*` that in-import to client.
3) Jalankan `npm run verify` and `REGRESSION_CHECKLIST.md`.

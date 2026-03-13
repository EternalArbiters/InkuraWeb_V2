# Server vs Client boundary (Stage 3)

The goal of this stage: repo **more tidy secara structure** with batas that clear antara:

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
- `server/services/*` → business logic (notifications, etc)

All file server-only **required** punya `import "server-only";` in baris most atas.

### 2) Client-only helpers must ditandai `import "client-only";`

Ini mencegah client helper not intentionally in-import from server component / route handler.

Example already ditandai:

- `apps/web/lib/commentMediaClient.ts`
- `apps/web/lib/r2UploadClient.ts`
- `apps/web/hooks/useAuthModal.ts`

### 3) Folder `apps/web/lib/**` for kode safe used in mana pun

`lib/` should contained thing-thing seperti:

- catalog statis (`genreCatalog`, `warningCatalog`, etc)
- util pure (`slugify`, `time`, `utils`)
- helper client (still may, tapi required `client-only` if use browser API)

If sebuah modul butuh Prisma/R2/headers/cookies/bcrypt, **pindahkan to `server/`**.

## Checklist before merge

1) There is no import of Prisma/NextAuth server session/R2 from client components (`"use client"`).
2) There is no `server/*` module imported into the client.
3) Jalankan `npm run verify` and `REGRESSION_CHECKLIST.md`.

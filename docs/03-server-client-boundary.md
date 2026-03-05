# Server vs Client boundary (Stage 3)

Tujuan tahap ini: repo **lebih rapi secara struktur** dengan batas yang jelas antara:

- **Server-only code** (Prisma, NextAuth server session, Cloudflare R2, Resend email, crypto/bcrypt, Next headers/cookies)
- **Client-only code** (browser APIs seperti `window`, `localStorage`, `crypto.subtle`, presigned upload via fetch browser)

## Aturan praktis

### 1) Server-only code harus hidup di `apps/web/server/**`

Contoh:

- `server/db/*` → Prisma
- `server/auth/*` → NextAuth options, requireUser/admin checks
- `server/storage/*` → R2 (S3-compatible)
- `server/uploads/*` → helper upload server-side
- `server/http/*` → helper fetch server-side (forward cookies)
- `server/services/*` → business logic (notifications, dll)

Semua file server-only **wajib** punya `import "server-only";` di baris paling atas.

### 2) Client-only helpers harus ditandai `import "client-only";`

Ini mencegah client helper tidak sengaja di-import dari server component / route handler.

Contoh yang sudah ditandai:

- `apps/web/lib/commentMediaClient.ts`
- `apps/web/lib/r2UploadClient.ts`
- `apps/web/hooks/useAuthModal.ts`

### 3) Folder `apps/web/lib/**` untuk kode yang aman dipakai di mana pun

`lib/` sebaiknya berisi hal-hal seperti:

- catalog statis (`genreCatalog`, `warningCatalog`, dll)
- util pure (`slugify`, `time`, `utils`)
- helper client (tetap boleh, tapi wajib `client-only` jika pakai browser API)

Kalau sebuah modul butuh Prisma/R2/headers/cookies/bcrypt, **pindahkan ke `server/`**.

## Checklist sebelum merge

1) Tidak ada import Prisma/NextAuth server session/R2 dari komponen client (`"use client"`).
2) Tidak ada modul `server/*` yang di-import ke client.
3) Jalankan `npm run verify` dan `docs/REGRESSION_CHECKLIST.md`.

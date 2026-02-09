# Inkura (inkura_v4)

## Tech Stack
- Next.js (App Router)
- TailwindCSS
- Prisma + SQLite
- NextAuth (Credentials + optional Google/Discord)
- Upload storage: lokal `public/uploads/...` (dev)

## Requirements
- Node.js 18+ (disarankan 20+)
- npm / pnpm (project ini pakai npm scripts, tapi pnpm juga bisa)

## Setup cepat
1. Install deps
   - `npm install`
2. Generate Prisma client
   - `npm run prisma:generate`
3. Jalankan migration (membuat SQLite db)
   - `npm run prisma:migrate`
4. Optional seed
   - `npm run prisma:seed`
5. Run dev server
   - `npm run dev`

Lalu buka `http://localhost:3000`.

## Environment (.env)
File `.env` sudah disediakan untuk dev:

```
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-change-me
```

OAuth (opsional):

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
```

## Feature checklist (v4)
-  Prisma schema: User, Work, Chapter, ChapterText (novel), ComicPage (comic)
-  NextAuth sebagai single source of truth (Credentials + optional OAuth)
-  Studio: create work → create chapter → upload text/images
-  Studio: edit work, edit chapter
-  Studio: manage comic pages (upload more, reorder, delete)
-  Publish/Draft toggle + `/all` hanya menampilkan PUBLISHED
-  Reader: novel (text) + comic (vertical pages)

## Catatan
- Upload disimpan di folder lokal `public/uploads`. Ini cocok untuk dev/MVP. Untuk production sebaiknya pindah ke S3/R2/Supabase Storage.
- Routing + shell layout sudah dirapihin (navbar 1, tidak ada 404 untuk route utama).

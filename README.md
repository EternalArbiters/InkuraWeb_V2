# Inkura v10 (Monorepo)

Struktur: `apps/web` (frontend) dan `apps/api` (backend API + Prisma).

## Dev

```bash
npm install
npm run db:init
npm run dev
```

- Web: http://localhost:3000
- API: http://localhost:3001

Catatan:
- `apps/web` mem-proxy `/api/*` dan `/uploads/*` ke `apps/api`.

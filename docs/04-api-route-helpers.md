# Tahap 4 — API Route Helpers & Konvensi

Tujuan tahap ini adalah merapikan layer API (Next.js App Router route handlers) **tanpa mengubah fitur** dengan:

- mengurangi boilerplate `NextResponse.json(...)` yang tersebar
- membuat pola error handling konsisten
- menyatukan akses session (`getSession()`)
- menyediakan helper parsing request yang aman (JSON + meta client)

## Perubahan utama

### 1) Helper API untuk Response JSON
Lokasi: `apps/web/server/http/response.ts`

Gunakan helper berikut di route handlers:

- `json(data, { status })`
- `error(message, status)`

dan beberapa shortcut:

- `badRequest()`, `unauthorized()`, `forbidden()`, `notFound()`, `conflict()`, `internalError()`, dll.

Catatan: format error **tetap sama** dengan kode sebelumnya, yaitu:

```ts
{ error: string }
```

### 2) Wrapper route handler: `apiRoute(...)`
Lokasi: `apps/web/server/http/route.ts`

Wrapper ini menangkap error yang dilempar dari dalam handler dan mengubahnya menjadi response JSON:

- `throw new ApiError(400, "message")` → `{ error: "message" }` status 400
- `throw new Error("UNAUTHORIZED")` → status 401
- `throw new Error("FORBIDDEN")` → status 403
- error lain → status 500 (dan di-log)

Route handler kini dianjurkan diekspor sebagai const:

```ts
import { apiRoute, json } from "@/server/http";

export const GET = apiRoute(async (req: Request) => {
  return json({ ok: true });
});
```

### 3) Session wrapper
Lokasi: `apps/web/server/auth/session.ts`

Route handler yang butuh session sebaiknya memakai:

```ts
import { getSession } from "@/server/auth/session";
```

Agar konsisten (menghindari copy-paste `getServerSession(authOptions)`).

Tambahan helper (opsional):
- `requireSessionUserId()`
- `requireAdminSession()`

Lokasi: `apps/web/server/http/auth.ts`

### 4) Safe request parsing helpers
Lokasi: `apps/web/server/http/request.ts`

- `readJsonObject(req)` → selalu menghasilkan object (fallback `{}`) seperti pola lama `req.json().catch(() => ({}))`
- `getClientMeta(req)` → `{ ip, userAgent }`
- `asString`, `asOptionalBool`, `toJsonSafe` (utility umum)

## Definition of Done (Tahap 4)

- Semua route handlers memakai `apiRoute(...)` (error handling konsisten).
- Semua response JSON memakai helper `json(...)` (mengurangi boilerplate `NextResponse.json`).
- Akses session menggunakan `getSession()` wrapper (bukan `getServerSession(authOptions)`).
- Tidak ada perubahan fitur: jalankan `docs/REGRESSION_CHECKLIST.md`.


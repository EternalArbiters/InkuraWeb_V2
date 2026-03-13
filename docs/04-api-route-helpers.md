# Stage 4 — API Route Helpers & Konvensi

The goal of this stage is clean up layer API (Next.js App Router route handlers) **without changing features** with:

- reduce boilerplate `NextResponse.json(...)` that tersebar
- make pola consistent error handling
- menyatukan akses session (`getSession()`)
- provide safe request-parsing helpers (JSON + meta client)

## Perubahan main

### 1) Helper API for Response JSON
Lokasi: `apps/web/server/http/response.ts`

Gunakan helper following in route handlers:

- `json(data, { status })`
- `error(message, status)`

and several shortcut:

- `badRequest()`, `unauthorized()`, `forbidden()`, `notFound()`, `conflict()`, `internalError()`, etc.

Note: format error **still same** with kode previously, yaitu:

```ts
{ error: string }
```

### 2) Wrapper route handler: `apiRoute(...)`
Lokasi: `apps/web/server/http/route.ts`

Wrapper this menangkap error that dilempar from dalam handler and mengubahnya become response JSON:

- `throw new ApiError(400, "message")` → `{ error: "message" }` status 400
- `throw new Error("UNAUTHORIZED")` → status 401
- `throw new Error("FORBIDDEN")` → status 403
- error lain → status 500 (and in-log)

Route handler kini dianjurkan diekspor as const:

```ts
import { apiRoute, json } from "@/server/http";

export const GET = apiRoute(async (req: Request) => {
  return json({ ok: true });
});
```

### 3) Session wrapper
Lokasi: `apps/web/server/auth/session.ts`

Route handler that butuh session should uses:

```ts
import { getSession } from "@/server/auth/session";
```

To keep things consistent (avoid copy-pasting `getServerSession(authOptions)`).

Tambahan helper (optional):
- `requireSessionUserId()`
- `requireAdminSession()`

Lokasi: `apps/web/server/http/auth.ts`

### 4) Safe request parsing helpers
Lokasi: `apps/web/server/http/request.ts`

- `readJsonObject(req)` → sethen menghasilkan object (fallback `{}`) seperti pola old `req.json().catch(() => ({}))`
- `getClientMeta(req)` → `{ ip, userAgent }`
- `asString`, `asOptionalBool`, `toJsonSafe` (utility general)

## Definition of Done (Stage 4)

- All route handlers uses `apiRoute(...)` (consistent error handling).
- All response JSON uses helper `json(...)` (reduce boilerplate `NextResponse.json`).
- Akses session using `getSession()` wrapper (not `getServerSession(authOptions)`).
- There is no feature change: jalankan `REGRESSION_CHECKLIST.md`.


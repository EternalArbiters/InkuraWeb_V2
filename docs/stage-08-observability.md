# Stage 8 — Observability & Error Hygiene

Goal: when bug appear, we can **debug cepat** without changing features.

Stage this focuses on on 2 thing:

1) **Server logging** that more terstructure (minimal: request id + route + status + userId if there is).
2) **UI error boundary** that consistent in route penting.

> Note: this is not a “new feature.” There is no user flow change. This only tidies up the instrumentation.

---

## 1) Structured server logging (JSON)

### Lokasi
- `apps/web/server/observability/logger.ts`
- `apps/web/server/observability/api.ts`

### Implementasi
- `apiRoute()` (`apps/web/server/http/route.ts`) now:
  - make/menentukan **requestId** (ambil from header `x-request-id` / `x-vercel-id` / `cf-ray`, or generate new)
  - adding header **`x-request-id`** on **all response** (best-effort)
  - melakukan **JSON logging** for:
    - response status **>= 500** (`api.response_error`)
    - unhandled exception (`api.unhandled_error`)
  - (optional) log all request if `INKURA_LOG_REQUESTS=1`

### Shape log
Example (disederhanakan):

```json
{
  "ts": "2026-03-05T12:00:00.000Z",
  "level": "error",
  "env": "production",
  "service": "inkura-web",
  "event": "api.unhandled_error",
  "requestId": "...",
  "method": "POST",
  "path": "/api/studio/works",
  "status": 500,
  "code": "INTERNAL_ERROR",
  "userId": "...",
  "durationMs": 123
}
```

### Env vars
Tambahan optional (see `apps/web/.env.example`):
- `INKURA_LOG_LEVEL=info` (debug/info/warn/error)
- `INKURA_LOG_REQUESTS=1` (log each request API)
- `INKURA_SERVICE_NAME=...`

---

## 2) UI Error Boundaries

### Lokasi
- Root error boundary:
  - `apps/web/app/error.tsx`
  - `apps/web/app/global-error.tsx`
- Segment error boundaries (route penting):
  - `apps/web/app/studio/error.tsx`
  - `apps/web/app/admin/error.tsx`
  - `apps/web/app/w/error.tsx`
  - `apps/web/app/read/error.tsx`
  - `apps/web/app/browse/error.tsx`
  - `apps/web/app/search/error.tsx`

### Shared UI
- `apps/web/app/components/errors/ErrorView.tsx`

All error boundary using UI same (card + CTA "Try again" + link back/home), sehingga:
- UX consistent
- more easy maintenance

---

## Definition of Done
- All API response menyertakan `x-request-id`.
- Unhandled server errors menghasilkan log JSON that consistent (requestId + route + status + userId if there is).
- Error boundary tersedia for route penting and tampil consistent.

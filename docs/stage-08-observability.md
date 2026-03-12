# Stage 8 — Observability & Error Hygiene

Tujuan: ketika bug appear, kita can **debug cepat** without mengubah features.

Stage this fokus pada 2 thing:

1) **Server logging** that more terstructure (minimal: request id + route + status + userId if there is).
2) **UI error boundary** that consistent in route penting.

> Note: this not “features new”. Tidak there is perubahan flow user. Ini rapihin instrumentation.

---

## 1) Structured server logging (JSON)

### Lokasi
- `apps/web/server/observability/logger.ts`
- `apps/web/server/observability/api.ts`

### Implementasi
- `apiRoute()` (`apps/web/server/http/route.ts`) now:
  - membuat/menentukan **requestId** (ambil from header `x-request-id` / `x-vercel-id` / `cf-ray`, or generate new)
  - menambahkan header **`x-request-id`** pada **all response** (best-effort)
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
Tambahan optional (lihat `apps/web/.env.example`):
- `INKURA_LOG_LEVEL=info` (debug/info/warn/error)
- `INKURA_LOG_REQUESTS=1` (log setiap request API)
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

Semua error boundary menggunakan UI same (card + CTA "Try again" + link back/home), sehingga:
- UX consistent
- more mudah maintenance

---

## Definition of Done
- Semua API response menyertakan `x-request-id`.
- Unhandled server errors menghasilkan log JSON that consistent (requestId + route + status + userId if there is).
- Error boundary tersedia for route penting and tampil consistent.

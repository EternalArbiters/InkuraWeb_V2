# Stage 8 — Observability & Error Hygiene

Tujuan: ketika bug muncul, kita bisa **debug cepat** tanpa mengubah fitur.

Stage ini fokus pada 2 hal:

1) **Server logging** yang lebih terstruktur (minimal: request id + route + status + userId bila ada).
2) **UI error boundary** yang konsisten di route penting.

> Catatan: ini bukan “fitur baru”. Tidak ada perubahan flow user. Ini rapihin instrumentation.

---

## 1) Structured server logging (JSON)

### Lokasi
- `apps/web/server/observability/logger.ts`
- `apps/web/server/observability/api.ts`

### Implementasi
- `apiRoute()` (`apps/web/server/http/route.ts`) sekarang:
  - membuat/menentukan **requestId** (ambil dari header `x-request-id` / `x-vercel-id` / `cf-ray`, atau generate baru)
  - menambahkan header **`x-request-id`** pada **semua response** (best-effort)
  - melakukan **JSON logging** untuk:
    - response status **>= 500** (`api.response_error`)
    - unhandled exception (`api.unhandled_error`)
  - (opsional) log semua request jika `INKURA_LOG_REQUESTS=1`

### Shape log
Contoh (disederhanakan):

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
Tambahan opsional (lihat `apps/web/.env.example`):
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

Semua error boundary menggunakan UI yang sama (card + CTA "Coba lagi" + link back/home), sehingga:
- UX konsisten
- lebih mudah maintenance

---

## Definition of Done
- Semua API response menyertakan `x-request-id`.
- Unhandled server errors menghasilkan log JSON yang konsisten (requestId + route + status + userId jika ada).
- Error boundary tersedia untuk route penting dan tampil konsisten.

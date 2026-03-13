# Perf Refactor — Stage 0 Baseline & Guardrails

This document is baseline work for refactor performa Inkura next.

## Guardrails non-negotiable

1. **Do not remove any features**
2. Every completed stage must produce a **full repo ZIP of the latest version**
3. Stage next **sethen** dimulai from hasil stage previously
4. Every change must pass `npm run verify` before it is considered ready to continue
5. Setelah tiap stage, check again `docs/REGRESSION_CHECKLIST.md`

## Fokus issue that seandg dibenahi

Berdasarkan audit initial, tekanan usage Vercel most large datang from kombinasi:

- render `force-dynamic` that terthen luas
- server page that calls API internal sendiri through `apiJson()`
- fetch `no-store` that mematikan peluang cache
- polling background that continuously hitting endpoint
- middleware + auth surface that terthen often tersentuh

## Urutan stage refactor

### Stage 0
Safety net and baseline. No product features are changed.

### Stage 1
Kurangi fan-out request from server page to API internal.

### Stage 2
Rapikan strategi dynamic/static/caching without changing behavior user-facing.

### Stage 3
Hematkan polling background and permukaan auth/middleware.

### Stage 4
Dedupe query, batching, and perbaikan DB/data access.

### Stage 5
Burn-in, verifikasi final, and rollout.

## Snapshot scan statis for ZIP this

Hasil `npm run refactor:stage0` on snapshot stage 0 this:

- `force-dynamic` exports: **45**
- server-page import `apiJson()`: **30** file
- total call `apiJson()` in `app/**`: **50**
- `cache: "no-store"`: **7**
- header `Cache-Control: no-store`: **4**
- `setInterval()`: **3**

Rail / page that most menonjol for stage next:

- `apps/web/app/home/page.tsx` → 5 call `apiJson()`
- `apps/web/app/search/page.tsx` → 4 call `apiJson()`
- `apps/web/app/settings/account/page.tsx` → 4 call `apiJson()`
- `apps/web/app/studio/new/page.tsx` → 4 call `apiJson()`
- `apps/web/app/studio/works/[workId]/edit/page.tsx` → 4 call `apiJson()`

## Snapshot hotspot initial

Hotspot main that will become target stage next:

- `apps/web/app/layout.tsx`
  - memaksa root app `force-dynamic`
- `apps/web/server/http/apiJson.ts`
  - fetch internal uses `cache: "no-store"`
- `apps/web/app/home/page.tsx`
  - fan-out several `apiJson()` sekaligus
- `apps/web/app/search/page.tsx`
  - many fetch server-side for prefs + taxonomy + works
- `apps/web/app/components/NavCountBadge.tsx`
  - polling `setInterval(..., 30000)` to unread count
- `apps/web/middleware.ts`
  - matcher area auth/protected enough luas

## Cara ambil baseline statis

From root repo:

```bash
npm run refactor:stage0
```

Perintah that will memindai hotspot statis seperti:

- `force-dynamic`
- import/call `apiJson()` in server page
- `cache: "no-store"`
- header `Cache-Control: no-store`
- `setInterval()`

Tujuannya not menggantikan profiling runtime, tapi memberi baseline cepat that repeatable each before/sealready refactor.

## Definition of done stage 0

Stage 0 considered complete if:

- safety net already terdokumentasi
- baseline hotspot can dipindai again with satu command
- not there is features changed
- repo siap dijadikan point initial for stage 1

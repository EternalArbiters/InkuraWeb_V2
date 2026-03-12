# Perf Refactor — Tahap 0 Baseline & Guardrails

This document adalah baseline work for refactor performa Inkura berikutnya.

## Guardrails non-negotiable

1. **Tidak menghilangkan features apa pun**
2. Setiap stage complete must menghasilkan **ZIP repo utuh versi ternew**
3. Tahap berikutnya **sethen** dimulai from hasil stage beforenya
4. Setiap perubahan must lolos `npm run verify` before dianggap siap continue
5. Setelah tiap stage, check again `docs/REGRESSION_CHECKLIST.md`

## Fokus masalah that seandg dibenahi

Berdasarkan audit awal, tekanan usage Vercel paling besar datang from kombinasi:

- render `force-dynamic` that terthen luas
- server page that calls API internal sendiri through `apiJson()`
- fetch `no-store` that mematikan peluang cache
- polling background that terus memukul endpoint
- middleware + auth surface that terthen sering tersentuh

## Urutan stage refactor

### Tahap 0
Safety net and baseline. Tidak mengubah features produk.

### Tahap 1
Kurangi fan-out request from server page to API internal.

### Tahap 2
Rapikan strategi dynamic/static/caching without mengubah behavior user-facing.

### Tahap 3
Hematkan polling background and permukaan auth/middleware.

### Tahap 4
Dedupe query, batching, and perbaikan DB/data access.

### Tahap 5
Burn-in, verifikasi akhir, and rollout.

## Snapshot scan statis for ZIP this

Hasil `npm run refactor:stage0` pada snapshot stage 0 this:

- `force-dynamic` exports: **45**
- server-page import `apiJson()`: **30** file
- total call `apiJson()` in `app/**`: **50**
- `cache: "no-store"`: **7**
- header `Cache-Control: no-store`: **4**
- `setInterval()`: **3**

Rail / page that most menonjol for stage berikutnya:

- `apps/web/app/home/page.tsx` → 5 call `apiJson()`
- `apps/web/app/search/page.tsx` → 4 call `apiJson()`
- `apps/web/app/settings/account/page.tsx` → 4 call `apiJson()`
- `apps/web/app/studio/new/page.tsx` → 4 call `apiJson()`
- `apps/web/app/studio/works/[workId]/edit/page.tsx` → 4 call `apiJson()`

## Snapshot hotspot awal

Hotspot main that akan become target stage berikutnya:

- `apps/web/app/layout.tsx`
  - memaksa root app `force-dynamic`
- `apps/web/server/http/apiJson.ts`
  - fetch internal memakai `cache: "no-store"`
- `apps/web/app/home/page.tsx`
  - fan-out several `apiJson()` sekaligus
- `apps/web/app/search/page.tsx`
  - banyak fetch server-side for prefs + taxonomy + works
- `apps/web/app/components/NavCountBadge.tsx`
  - polling `setInterval(..., 30000)` to unread count
- `apps/web/middleware.ts`
  - matcher area auth/protected cukup luas

## Cara ambil baseline statis

From root repo:

```bash
npm run refactor:stage0
```

Perintah that akan memindai hotspot statis seperti:

- `force-dynamic`
- import/call `apiJson()` in server page
- `cache: "no-store"`
- header `Cache-Control: no-store`
- `setInterval()`

Tujuannya not menggantikan profiling runtime, tapi memberi baseline cepat that repeatable setiap before/sealready refactor.

## Definition of done stage 0

Tahap 0 dianggap complete if:

- safety net already terdokumentasi
- baseline hotspot can dipindai again with satu command
- not there is features changed
- repo siap dijadikan titik awal for stage 1

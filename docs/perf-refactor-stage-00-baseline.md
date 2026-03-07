# Perf Refactor — Tahap 0 Baseline & Guardrails

Dokumen ini adalah baseline kerja untuk refactor performa Inkura berikutnya.

## Guardrails non-negotiable

1. **Tidak menghilangkan fitur apa pun**
2. Setiap tahap selesai harus menghasilkan **ZIP repo utuh versi terbaru**
3. Tahap berikutnya **selalu** dimulai dari hasil tahap sebelumnya
4. Setiap perubahan harus lolos `npm run verify` sebelum dianggap siap lanjut
5. Setelah tiap tahap, cek ulang `docs/REGRESSION_CHECKLIST.md`

## Fokus masalah yang sedang dibenahi

Berdasarkan audit awal, tekanan usage Vercel paling besar datang dari kombinasi:

- render `force-dynamic` yang terlalu luas
- server page yang memanggil API internal sendiri lewat `apiJson()`
- fetch `no-store` yang mematikan peluang cache
- polling background yang terus memukul endpoint
- middleware + auth surface yang terlalu sering tersentuh

## Urutan tahap refactor

### Tahap 0
Safety net dan baseline. Tidak mengubah fitur produk.

### Tahap 1
Kurangi fan-out request dari server page ke API internal.

### Tahap 2
Rapikan strategi dynamic/static/caching tanpa mengubah behavior user-facing.

### Tahap 3
Hematkan polling background dan permukaan auth/middleware.

### Tahap 4
Dedupe query, batching, dan perbaikan DB/data access.

### Tahap 5
Burn-in, verifikasi akhir, dan rollout.

## Snapshot scan statis untuk ZIP ini

Hasil `npm run refactor:stage0` pada snapshot tahap 0 ini:

- `force-dynamic` exports: **45**
- server-page import `apiJson()`: **30** file
- total call `apiJson()` di `app/**`: **50**
- `cache: "no-store"`: **7**
- header `Cache-Control: no-store`: **4**
- `setInterval()`: **3**

Rail / page yang paling menonjol untuk tahap berikutnya:

- `apps/web/app/home/page.tsx` → 5 call `apiJson()`
- `apps/web/app/search/page.tsx` → 4 call `apiJson()`
- `apps/web/app/settings/account/page.tsx` → 4 call `apiJson()`
- `apps/web/app/studio/new/page.tsx` → 4 call `apiJson()`
- `apps/web/app/studio/works/[workId]/edit/page.tsx` → 4 call `apiJson()`

## Snapshot hotspot awal

Hotspot utama yang akan jadi target tahap berikutnya:

- `apps/web/app/layout.tsx`
  - memaksa root app `force-dynamic`
- `apps/web/server/http/apiJson.ts`
  - fetch internal memakai `cache: "no-store"`
- `apps/web/app/home/page.tsx`
  - fan-out beberapa `apiJson()` sekaligus
- `apps/web/app/search/page.tsx`
  - banyak fetch server-side untuk prefs + taxonomy + works
- `apps/web/app/components/NavCountBadge.tsx`
  - polling `setInterval(..., 30000)` ke unread count
- `apps/web/middleware.ts`
  - matcher area auth/protected cukup luas

## Cara ambil baseline statis

Dari root repo:

```bash
npm run refactor:stage0
```

Perintah itu akan memindai hotspot statis seperti:

- `force-dynamic`
- import/call `apiJson()` di server page
- `cache: "no-store"`
- header `Cache-Control: no-store`
- `setInterval()`

Tujuannya bukan menggantikan profiling runtime, tapi memberi baseline cepat yang repeatable setiap sebelum/sesudah refactor.

## Definition of done tahap 0

Tahap 0 dianggap selesai bila:

- safety net sudah terdokumentasi
- baseline hotspot bisa dipindai ulang dengan satu command
- tidak ada fitur yang berubah
- repo siap dijadikan titik awal untuk tahap 1

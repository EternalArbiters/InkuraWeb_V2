# Debug upload issues

Dokumen ini membantu melacak masalah upload yang paling umum di Inkura, terutama untuk cover, comic pages, dan comment media.

## Gambaran flow upload

### Cover dan comic pages

Alur normalnya:

1. client meminta presign ke `POST /api/uploads/presign`
2. server memvalidasi session, ownership, scope, size, dan content type
3. client upload langsung ke Cloudflare R2 memakai `uploadUrl`
4. key/public URL dipersist ke DB lewat endpoint studio yang relevan

### Comment media

Alurnya sedikit berbeda:

1. client menghitung `sha256`
2. client meminta presign ke `POST /api/uploads/presign`
3. kalau object dengan hash yang sama sudah ada, server bisa mengembalikan `exists: true`
4. kalau belum ada, client upload ke R2
5. client memanggil `POST /api/uploads/commit`
6. server memverifikasi object di storage lalu membuat / update `MediaObject`

## Batas file dan content type yang berlaku

Berdasarkan rules saat ini:

- `covers` → maks 2MB, hanya `image/webp`, `image/png`, `image/jpeg`
- `pages` → maks 5MB, hanya `image/webp`, `image/png`, `image/jpeg`
- `comment_images` → maks 2MB, hanya `image/webp`, `image/png`, `image/jpeg`
- `comment_gifs` → maks 5MB, hanya `image/gif`
- `files` → maks 20MB, `application/pdf` atau `application/octet-stream`

## Cara triage paling cepat

Saat upload gagal, cek 3 langkah ini di browser devtools Network:

### 1) Presign request

Cek response `POST /api/uploads/presign`.

Yang perlu dilihat:

- status 200 atau bukan
- message error bila 4xx/5xx
- `x-request-id` untuk korelasi log
- apakah response berisi `uploadUrl`, `key`, dan `publicUrl`
- untuk comment media, apakah `exists: true`

### 2) PUT ke storage

Kalau presign berhasil, cek request upload ke R2:

- status harus sukses
- `content-type` harus cocok dengan yang dipresign
- file size tidak boleh melebihi limit

### 3) Commit / persist

Untuk comment media, cek `POST /api/uploads/commit`.

Untuk cover/pages studio, cek endpoint studio yang menyimpan key/url ke DB.

Kalau langkah ini gagal, object mungkin sudah ada di R2 tetapi DB belum menunjuk ke object tersebut.

## Error yang paling sering muncul

### `401 Unauthorized`

Biasanya berarti:

- user belum login
- session cookie tidak ikut terkirim
- origin auth tidak konsisten

Cek:

- `NEXTAUTH_URL`
- apakah request dikirim dari origin yang benar
- apakah session user masih aktif

### `403 Forbidden`

Biasanya berarti user bukan owner work/chapter dan bukan admin.

Cek:

- apakah work/chapter yang diedit memang milik user itu
- apakah admin email / role sesuai ekspektasi
- apakah request mengirim `workId` atau `chapterId` yang benar

### `400 Unsupported file type`

Penyebab umum:

- MIME type tidak termasuk whitelist
- file extension dan `contentType` tidak selaras
- GIF diupload ke scope image biasa, atau sebaliknya

### `400 File too large`

Penyebabnya file melebihi limit scope.

Cek ukuran file mentah sebelum upload.

### `404 Object not found in storage`

Ini sering muncul pada comment media commit. Biasanya karena:

- upload PUT gagal tetapi langkah commit tetap dijalankan
- key yang dikirim saat commit tidak sama dengan key hasil presign
- upload belum selesai, tapi commit sudah dipanggil

### Upload sukses tapi asset tidak tampil

Biasanya masalahnya salah satu dari ini:

- `R2_PUBLIC_BASE_URL` salah
- object tidak dapat diakses secara publik lewat URL yang dibentuk
- custom domain / CDN R2 belum benar
- key tersimpan, tapi URL publik yang dibentuk tidak cocok dengan konfigurasi bucket/domain

## Checklist env untuk upload

Minimal periksa ini:

```env
R2_ENDPOINT=            # atau R2_ACCOUNT_ID
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=              # atau R2_BUCKET_NAME
R2_PUBLIC_BASE_URL=
```

Kalau salah satu hilang, gejalanya bisa berbeda-beda: presign gagal, upload berhasil tapi asset tidak tampil, atau commit tidak sinkron.

## Memakai request id untuk debug server

Stage 8 menambahkan `x-request-id` di semua response API. Jadi saat upload gagal:

1. ambil `x-request-id` dari response gagal
2. cari log server dengan request id itu
3. cocokkan path, status, dan userId bila ada

Ini sangat membantu untuk membedakan error ownership, env, atau error storage.

## Pola masalah yang sering mengecoh

### Presign berhasil, tapi DB tidak berubah

Artinya upload ke storage belum otomatis berarti data aplikasi sudah terhubung. Masih ada langkah persist/commit yang harus sukses.

### Comment media terasa duplikat atau tidak upload ulang

Itu bisa normal karena scope comment media memakai **SHA-256 dedupe**. Kalau file identik sudah pernah ada, presign bisa mengembalikan `exists: true` dan client tidak perlu upload ulang.

### Lokal berhasil, production gagal

Biasanya penyebabnya:

- env R2 production tidak lengkap
- `R2_PUBLIC_BASE_URL` production tidak cocok
- user di production tidak lolos ownership check
- origin auth / session di production tidak stabil

## Langkah eskalasi yang paling aman

Kalau belum ketemu juga:

1. ulangi flow sambil membuka Network tab
2. catat status tiap langkah: presign, PUT, commit/persist
3. catat `x-request-id`
4. cek env upload yang aktif
5. jalankan smoke/regression pada flow terkait setelah perbaikan

# Debug upload issues

This document membantu melacak masalah upload that most general in Inkura, especially for cover, comic pages, and comment media.

## Gambaran flow upload

### Cover and comic pages

Alur normalnya:

1. client meminta presign to `POST /api/uploads/presign`
2. server memvalidasi session, ownership, scope, size, and content type
3. client upload directly to Cloudflare R2 memakai `uploadUrl`
4. key/public URL dipersist to DB through endpoint studio that are relevant

### Comment media

Alurnya sedikit berbeda:

1. client menghitung `sha256`
2. client meminta presign to `POST /api/uploads/presign`
3. if object with hash same already there is, server can mengembalikan `exists: true`
4. if not yet there is, client upload to R2
5. client calls `POST /api/uploads/commit`
6. server memverifikasi object in storage then membuat / update `MediaObject`

## Batas file and content type that berlaku

Berdasarkan rules currently:

- `covers` → maks 2MB, only `image/webp`, `image/png`, `image/jpeg`
- `pages` → maks 5MB, only `image/webp`, `image/png`, `image/jpeg`
- `comment_images` → maks 2MB, only `image/webp`, `image/png`, `image/jpeg`
- `comment_gifs` → maks 5MB, only `image/gif`
- `files` → maks 20MB, `application/pdf` or `application/octet-stream`

## Cara triage paling cepat

Saat upload failed, check 3 langkah this in browser devtools Network:

### 1) Presign request

Cek response `POST /api/uploads/presign`.

Yang perlu dilihat:

- status 200 or not
- message error if 4xx/5xx
- `x-request-id` for korelasi log
- apakah response bercontent `uploadUrl`, `key`, and `publicUrl`
- for comment media, apakah `exists: true`

### 2) PUT to storage

If presign successful, check request upload to R2:

- status must sukses
- `content-type` must cocok with that dipresign
- file size not may melebihi limit

### 3) Commit / persist

For comment media, check `POST /api/uploads/commit`.

For cover/pages studio, check endpoint studio that menyimpan key/url to DB.

If langkah this failed, object mungkin already there is in R2 tetapi DB not yet point to to object tersebut.

## Error that most sering appear

### `401 Unauthorized`

Biasanya berarti:

- user not yet login
- session cookie not ikut terkirim
- origin auth not consistent

Cek:

- `NEXTAUTH_URL`
- apakah request dikirim from origin that benar
- apakah session user still active

### `403 Forbidden`

Biasanya berarti user not owner work/chapter and not admin.

Cek:

- apakah work/chapter that diedit memang milik user that
- apakah admin email / role sesuai ekspektasi
- apakah request mengirim `workId` or `chapterId` that benar

### `400 Unsupported file type`

Penyebab general:

- MIME type not terenter whitelist
- file extension and `contentType` not selaras
- GIF diupload to scope image biasa, or sebaliknya

### `400 File too large`

Penyebabnya file melebihi limit scope.

Cek ukuran file mentah before upload.

### `404 Object not found in storage`

Ini sering appear pada comment media commit. Biasanya because:

- upload PUT failed tetapi langkah commit still dijalankan
- key that dikirim saat commit not sama with key hasil presign
- upload not yet complete, tapi commit already dipanggil

### Upload sukses tapi asset not tampil

Biasanya masalahnya salah satu from this:

- `R2_PUBLIC_BASE_URL` salah
- object not dapat diakses secara public through URL that dibentuk
- custom domain / CDN R2 not yet benar
- key tersimpan, tapi URL public that dibentuk not cocok with konfigurasi bucket/domain

## Checklist env for upload

Minimal periksa this:

```env
R2_ENDPOINT=            # atau R2_ACCOUNT_ID
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=              # atau R2_BUCKET_NAME
R2_PUBLIC_BASE_URL=
```

If salah satu hilang, gejalanya can berbeda-beda: presign failed, upload successful tapi asset not tampil, or commit not sinkron.

## Memakai request id for debug server

Stage 8 menambahkan `x-request-id` in all response API. Jadi saat upload failed:

1. ambil `x-request-id` from response failed
2. cari log server with request id that
3. cocokkan path, status, and userId if there is

Ini sangat membantu for membedakan error ownership, env, or error storage.

## Pola masalah that sering mengecoh

### Presign successful, tapi DB not berubah

Artinya upload to storage not yet otomatis berarti data aplikasi already terhubung. Masih there is langkah persist/commit that must sukses.

### Comment media terasa duplikat or not upload again

Itu can normal because scope comment media memakai **SHA-256 dedupe**. If file identik already pernah there is, presign can mengembalikan `exists: true` and client not perlu upload again.

### Lokal successful, production failed

Biasanya penyebabnya:

- env R2 production not lengkap
- `R2_PUBLIC_BASE_URL` production not cocok
- user in production not lolos ownership check
- origin auth / session in production not stabil

## Langkah eskalasi that safest

If not yet ketemu juga:

1. ulangi flow sambil membuka Network tab
2. catat status tiap langkah: presign, PUT, commit/persist
3. catat `x-request-id`
4. check env upload that active
5. jalankan smoke/regression pada flow terkait after perbaikan

# Debug upload issues

This document membantu melacak issue upload that most general in Inkura, especially for cover, comic pages, and comment media.

## Gambaran flow upload

### Cover and comic pages

Alur normalnya:

1. client meminta presign to `POST /api/uploads/presign`
2. server memvalidasi session, ownership, scope, size, and content type
3. client upload directly to Cloudflare R2 uses `uploadUrl`
4. key/public URL dipersist to DB through endpoint studio that are relevant

### Comment media

Alurnya few berbeda:

1. client menghitung `sha256`
2. client meminta presign to `POST /api/uploads/presign`
3. if object with hash same already there is, server can returning `exists: true`
4. if not yet there is, client upload to R2
5. client calls `POST /api/uploads/commit`
6. server verify object in storage then make / update `MediaObject`

## Batas file and content type that berlaku

Berdasarkan rules currently:

- `covers` → maks 2MB, only `image/webp`, `image/png`, `image/jpeg`
- `pages` → maks 5MB, only `image/webp`, `image/png`, `image/jpeg`
- `comment_images` → maks 2MB, only `image/webp`, `image/png`, `image/jpeg`
- `comment_gifs` → maks 5MB, only `image/gif`
- `files` → maks 20MB, `application/pdf` or `application/octet-stream`

## Cara triage most cepat

When an upload fails, check these 3 steps in the browser DevTools Network tab:

### 1) Presign request

Cek response `POST /api/uploads/presign`.

What to look for:

- status 200 or not
- message error if 4xx/5xx
- `x-request-id` for korelasi log
- apakah response contained `uploadUrl`, `key`, and `publicUrl`
- for comment media, apakah `exists: true`

### 2) PUT to storage

If presign successful, check request upload to R2:

- status must succeed
- `content-type` must match with that dipresign
- file size not may melebihi limit

### 3) Commit / persist

For comment media, check `POST /api/uploads/commit`.

For cover/pages studio, check endpoint studio that menyimpan key/url to DB.

If step this failed, object might already there is in R2 but DB not yet point to to object that.

## Error that most often appear

### `401 Unauthorized`

Biasanya berarti:

- user not yet login
- session cookie not also sent
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

- MIME type not including whitelist
- file extension and `contentType` not selaras
- GIF diupload to scope image regular, or sebaliknya

### `400 File too large`

Penyebabnya file melebihi limit scope.

Cek ukuran file mentah before upload.

### `404 Object not found in storage`

Ini often appear on comment media commit. Biasanya because:

- upload PUT failed but step commit still run
- key that dikirim when commit not same with key hasil presign
- upload not yet complete, tapi commit already dipanggil

### Upload succeed tapi asset not tampil

Biasanya masalahnya salah satu from this:

- `R2_PUBLIC_BASE_URL` salah
- object not can diakses secara public through URL that formed
- custom domain / CDN R2 not yet benar
- key tersimpan, tapi URL public that formed not match with konfigurasi bucket/domain

## Checklist env for upload

Minimal periksa this:

```env
R2_ENDPOINT=            # or R2_ACCOUNT_ID
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=              # or R2_BUCKET_NAME
R2_PUBLIC_BASE_URL=
```

If salah satu lost, gejalanya can berbeda-beda: presign failed, upload successful tapi asset not tampil, or commit not sinkron.

## Using the request ID for server debugging

Stage 8 adding `x-request-id` in all response API. Jadi when upload failed:

1. ambil `x-request-id` from response failed
2. search log server with request id that
3. cocokkan path, status, and userId if there is

Ini sangat membantu for membedakan error ownership, env, or error storage.

## Pola issue that often mengecoh

### Presign successful, tapi DB not berubah

This means uploading to storage does not automatically mean the application data is already connected. There is still a persist/commit step that must succeed.

### Comment media terasa duplicate or not upload again

Itu can normal because scope comment media uses **SHA-256 dedupe**. If file identical already ever there is, presign can returning `exists: true` and client not need upload again.

### Lokal successful, production failed

Biasanya penyebabnya:

- env R2 production not complete
- `R2_PUBLIC_BASE_URL` production not match
- user in production not pass ownership check
- origin auth / session in production not stable

## The safest escalation steps

If not yet ketemu juga:

1. ulangi flow sambil membuka Network tab
2. catat status tiap step: presign, PUT, commit/persist
3. catat `x-request-id`
4. check env upload that active
5. jalankan smoke/regression on flow related after perbaikan

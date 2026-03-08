# Storage Backfill Runbook (PR 6)

PR 6 menambahkan alat untuk **audit, re-optimize, dan cleanup** object image lama di bucket R2.

Tujuan utamanya:
- mengecilkan **storage existing**, bukan hanya upload baru,
- mendeteksi object yang tidak lagi direferensikan DB,
- memberi jalur backfill yang aman dengan **dry-run default**.

## Ruang lingkup aman untuk apply

Apply (`--apply`) aman dipakai untuk referensi yang **tidak tergantung sha256 unik**:
- avatar (`User.image`)
- work cover (`Work.coverKey` / `Work.coverImage`)
- chapter thumbnail (`Chapter.thumbnailKey` / `Chapter.thumbnailImage`)
- comic page (`ComicPage.imageKey` / `ComicPage.imageUrl`)

## Audit-only untuk comment media

`MediaObject` comment image / gif memakai `sha256` unik sebagai kontrak dedupe.
Karena itu PR 6 sengaja menjadikan scope berikut sebagai **audit-only**:
- `comment_images`
- `comment_gifs`

Untuk dua scope ini, pakai:
- `npm --workspace apps/web run storage:audit -- --scope=comment_images`
- `npm --workspace apps/web run storage:audit -- --scope=comment_gifs`

## Script yang tersedia

### 1) Audit bucket vs DB

```bash
npm --workspace apps/web run storage:audit -- --scope=all
```

Opsi berguna:
- `--scope=avatar|covers|pages|comment_images|comment_gifs|all`
- `--skip-r2` untuk audit berbasis DB saja
- `--head-limit=50` untuk sample HEAD check
- `--json` untuk output machine-readable

Contoh:

```bash
npm --workspace apps/web run storage:audit -- --scope=pages --head-limit=25
```

### 2) Re-optimize image lama (dry-run default)

```bash
npm --workspace apps/web run storage:reoptimize -- --scope=pages --limit=100
```

Script ini:
- download object lama dari R2,
- re-encode memakai profile upload yang sama,
- menghitung berapa byte yang bisa dihemat,
- **tidak menulis perubahan apa pun** sampai Anda menambahkan `--apply`.

Opsi penting:
- `--apply`
- `--delete-old`
- `--limit=100`
- `--min-bytes-saved=65536`
- `--min-percent-saved=0.1`
- `--version-tag=reopt-v1`

Contoh apply aman bertahap:

```bash
npm --workspace apps/web run storage:reoptimize -- --scope=covers --limit=25 --apply
```

Contoh apply + hapus object lama setelah pointer DB dipindah:

```bash
npm --workspace apps/web run storage:reoptimize -- --scope=pages --limit=25 --apply --delete-old
```

## Cleanup orphaned objects

Dry-run:

```bash
npm --workspace apps/web run storage:cleanup-orphans -- --scope=all
```

Apply:

```bash
npm --workspace apps/web run storage:cleanup-orphans -- --scope=all --apply
```

Default safety:
- hanya menghapus object yang **tidak direferensikan DB**
- hanya object yang lebih tua dari `--older-than-days=14`
- default `--delete-limit=250`

## Urutan operasi yang direkomendasikan

1. Jalankan audit penuh:
   ```bash
   npm --workspace apps/web run storage:audit -- --scope=all
   ```
2. Jalankan dry-run re-optimize untuk satu scope kecil dulu:
   ```bash
   npm --workspace apps/web run storage:reoptimize -- --scope=avatar --limit=25
   ```
3. Apply bertahap per scope:
   - avatar
   - covers
   - pages
4. Setelah pointer DB stabil, baru jalankan cleanup orphan:
   ```bash
   npm --workspace apps/web run storage:cleanup-orphans -- --scope=all --apply
   ```

## Catatan penting

- Script `storage:reoptimize` membuat **key baru** (`*.reopt-v1.*`) agar aman terhadap cache/CDN immutable. Ini sengaja dipilih daripada overwrite-in-place.
- `MediaObject` comment media tidak diubah pointer-nya di PR 6 karena perlu migrasi dedupe tersendiri.
- Selalu mulai dengan `--limit` kecil dan **tanpa `--apply`**.
- Simpan output JSON audit sebelum apply, agar rollback lebih mudah.

# Storage Backfill Runbook (PR 6)

PR 6 menambahkan alat for **audit, re-optimize, and cleanup** object image old in bucket R2.

Tujuan utsafeya:
- mengecilkan **storage existing**, not only upload new,
- mendeteksi object that not lagi direferensikan DB,
- memberi jflow backfill safe with **dry-run default**.

## Ruang lingkup safe for apply

Apply (`--apply`) safe used for referensi that **not tergantung sha256 unik**:
- avatar (`User.image`)
- work cover (`Work.coverKey` / `Work.coverImage`)
- chapter thumbnail (`Chapter.thumbnailKey` / `Chapter.thumbnailImage`)
- comic page (`ComicPage.imageKey` / `ComicPage.imageUrl`)

## Audit-only for comment media

`MediaObject` comment image / gif memakai `sha256` unik sebagai kontrak dedupe.
Karena that PR 6 intentionally menjadikan scope berikut sebagai **audit-only**:
- `comment_images`
- `comment_gifs`

For dua scope this, use:
- `npm --workspace apps/web run storage:audit -- --scope=comment_images`
- `npm --workspace apps/web run storage:audit -- --scope=comment_gifs`

## Script that tersedia

### 1) Audit bucket vs DB

```bash
npm --workspace apps/web run storage:audit -- --scope=all
```

Opsi berguna:
- `--scope=avatar|covers|pages|comment_images|comment_gifs|all`
- `--skip-r2` for audit berbasis DB saja
- `--head-limit=50` for sample HEAD check
- `--json` for output machine-readable

Example:

```bash
npm --workspace apps/web run storage:audit -- --scope=pages --head-limit=25
```

### 2) Re-optimize image old (dry-run default)

```bash
npm --workspace apps/web run storage:reoptimize -- --scope=pages --limit=100
```

Script this:
- download object old from R2,
- re-encode memakai profile upload same,
- menghitung berapa byte that can dihemat,
- **not menulis perubahan apa pun** sampai Anda menambahkan `--apply`.

Opsi penting:
- `--apply`
- `--delete-old`
- `--limit=100`
- `--min-bytes-saved=65536`
- `--min-percent-saved=0.1`
- `--version-tag=reopt-v1`

Example apply safe bertahap:

```bash
npm --workspace apps/web run storage:reoptimize -- --scope=covers --limit=25 --apply
```

Example apply + hapus object old after pointer DB dipindah:

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
- only removing object that **not direferensikan DB**
- only object that more tua from `--older-than-days=14`
- default `--delete-limit=250`

## Urutan operasi that direkomendasikan

1. Jalankan audit penuh:
   ```bash
   npm --workspace apps/web run storage:audit -- --scope=all
   ```
2. Jalankan dry-run re-optimize for satu scope kecil first:
   ```bash
   npm --workspace apps/web run storage:reoptimize -- --scope=avatar --limit=25
   ```
3. Apply bertahap per scope:
   - avatar
   - covers
   - pages
4. Setelah pointer DB stabil, new jalankan cleanup orphan:
   ```bash
   npm --workspace apps/web run storage:cleanup-orphans -- --scope=all --apply
   ```

## Catatan penting

- Script `storage:reoptimize` membuat **key new** (`*.reopt-v1.*`) so that safe terhadap cache/CDN immutable. Ini intentionally dipilih daripada overwrite-in-place.
- `MediaObject` comment media not diubah pointer-nya in PR 6 because perlu migrasi dedupe tersendiri.
- Sethen mulai with `--limit` kecil and **without `--apply`**.
- Simpan output JSON audit before apply, so that rollback more mudah.

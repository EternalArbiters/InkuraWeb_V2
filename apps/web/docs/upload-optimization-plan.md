# Upload Optimization Plan (PR 1 Foundation)

Goal of PR 1:
- menyiapkan **kontrak optimasi upload image** per scope,
- adding **util optimizer terpusat**,
- menjaga perilaku upload currently still safe (**not yet mengubah flow produksi**),
- memberi landasan for PR next without removing features.

## Scope that must tertutup in final roadmap

- `avatar`
- `covers`
- `comment_images`
- `pages`

Scope that **not** dipaksa optimasi on fase initial:
- `comment_gifs`
- `files`

## Kontrak per scope

### Avatar
- Max upload bytes: **2 MB**
- Output target: **WebP**
- Resize target: max **640 × 640**
- Aspect target: **1:1 visual intent**, but **without hard crop** in stage optimasi
- Quality target: **0.82**
- Metadata: **strip**
- Note: focus / zoom still dikendalikan UI profile already there is

### Cover
- Max upload bytes: **2 MB**
- Output target: **WebP**
- Resize target: max **900 × 1200**
- Aspect target: **3:4**
- Quality target: **0.82**
- Metadata: **strip**
- Note: baseline this intentionally mengikuti kontrak output old so that not mengubah tampilan cover secara mendadak

### Comment Image
- Max upload bytes: **2 MB**
- Output target: **WebP**
- Resize target: max **1280 px** on scontent terpanjang
- Quality target: **0.80**
- Metadata: **strip**
- Note: hash dedupe laternya must dihitung from **blob hasil optimasi final**

### Comic Page
- Max upload bytes: **5 MB**
- Output target: **WebP**
- Resize target: adaptif, with guardrail:
  - max width **1800 px**
  - max height **3200 px**
  - max long edge **2400 px**
  - max megapixels **6 MP**
- Quality target: **0.88**
- Metadata: **strip**
- Note: readability more penting daripada savings agresif

## Prinsip keputusan optimasi

1. **Do not upscale file small**.
2. **Normalize orientation** and buang metadata through re-encode canvas.
3. **Skip recompress** if file already modern, small, and not need resize.
4. **Preserve alpha** with output alpha-safe (`image/webp`) if need.
5. **Do not sentuh animated GIF** on fase initial.
6. **PR 1 not mengubah caller**; only menyiapkan pondasi so that PR continuean can mengalihkan flow upload secara bertahap.

## Dampak PR 1

PR this safe for applied first because:
- not yet memaksa flow upload new,
- not yet mengubah kontrak API caller active,
- not yet medeactivate fallback server that there is.

Stage next will mengactivekan optimizer on:
1. avatar,
2. comment images,
3. comic pages,
4. cover create/edit,
5. hardening server,
6. backfill bucket old.


## PR 3 status
- Comic page uploads now prepare optimized browser-side blobs before presign/upload.
- Chapter creation and Manage Pages surfaces now show before/after byte estimates for selected page batches.
- Page uploads emit optimization-aware upload metrics via the shared R2 client helper.

## PR 4 status
- New work cover creation now uploads an optimized cover blob via presign/upload before submitting work metadata.
- Work edit cover replacement now uses the same shared cover optimizer and preview summary flow.
- Studio work creation accepts either a client-uploaded `coverUrl` / `coverKey` pair or the legacy raw cover file fallback.
- Presign uploads for covers now allow create-flow uploads without an existing `workId`, while keeping ownership checks for existing works.


## PR 5 status
- Upload presign and commit routes now validate optimization metadata for optimized scopes and warn when legacy fallback paths are still used.
- Avatar presign now applies the same guardrail validation and logs warning metadata instead of silently accepting mismatched optimized payloads.
- Shared upload metrics now include optimization reason, dimensions, and fallback usage so rollout can be observed more safely.
- Chapter edit thumbnail uploads now pass through the shared page optimizer, closing a previously missed raw page-image path.

## PR 6 status
- Added storage backfill scripts for bucket audit, safe dry-run re-optimization, and orphan cleanup.
- Backfill apply flow now supports avatar, work cover, chapter thumbnail, and comic page references with new versioned object keys.
- Comment media (`MediaObject`) is explicitly audit-only in PR 6 because sha256 dedupe needs a dedicated migration before safe rewrites.
- Added a dedicated storage backfill runbook and package scripts so the existing bucket can be reduced gradually after reviewing dry-run reports.


## Final completion status
- Repo-side implementation for the staged upload optimization roadmap is complete.
- New image upload coverage is in place for avatar, comment images, comic pages, work covers, and chapter edit thumbnail images.
- Server-side guardrails and upload metrics are wired for optimized scopes.
- Existing bucket audit / re-optimization / orphan cleanup tooling is included for operational rollout.
- See `docs/upload-optimization-final-status.md` for the completion summary.
- See `docs/upload-optimization-rollout-checklist.md` for the final verification and rollout order.

# Upload Optimization Rollout Checklist

Use this checklist after restoring dependencies and environment variables.

## 1. Install and baseline
- Run workspace install from repo root.
- Run Prisma generate / validate as usual.
- Confirm environment variables for R2, database, auth, and email are present.

## 2. Verify code health
- Run typecheck.
- Run unit tests.
- Run build.
- If available, run smoke e2e flows covering studio, auth, and comments.

## 3. Manual QA for upload paths

### Avatar
- Upload a large JPEG from a phone camera.
- Confirm preview still respects focus/zoom UI.
- Confirm final avatar is accepted and renders.
- Confirm before/after size summary appears.

### Comment image
- Upload a normal JPEG/PNG image.
- Confirm upload succeeds.
- Confirm repeated upload of the same source image dedupes based on optimized bytes.
- Confirm transparent PNG comment art keeps transparency.

### Comic pages
- Upload multiple large pages in chapter create.
- Upload multiple large pages in manage pages.
- Confirm text remains readable.
- Confirm before/after batch summary appears.

### Covers
- Create a new work with a large cover image.
- Edit an existing work cover.
- Confirm preview uses optimized file.
- Confirm the resulting cover still fits the expected 3:4 presentation contract.

### Chapter edit thumbnail
- Replace the chapter thumbnail/page-like image.
- Confirm upload succeeds and metrics remain clean.

## 4. Metrics review
- Inspect upload metrics for:
  - `beforeBytes`
  - `afterBytes`
  - `bytesSaved`
  - `compressionRatio`
  - `optimizationVersion`
  - `fallbackUsed`
- Confirm optimized scopes are not frequently falling back.

## 5. Storage backfill dry-run
- Run `storage:audit` first.
- Run `storage:reoptimize` in dry-run mode.
- Review counts, byte savings, and target keys.
- Do **not** apply comment media rewrites without a dedicated sha256 migration plan.

## 6. Cleanup dry-run
- Run orphan cleanup in dry-run mode.
- Review candidate keys and age thresholds.
- Only then allow delete mode.

## 7. Production rollout order
1. deploy code
2. verify new uploads
3. inspect metrics for fallback / mismatch warnings
4. run audit on existing bucket
5. run backfill for safe scopes in batches
6. run orphan cleanup conservatively

## 8. Rollback posture
- New uploads keep server guardrails and legacy fallbacks where appropriate.
- Existing-object backfill should always be done with dry-run first and versioned keys.
- Never bulk-delete original objects until new references are verified.

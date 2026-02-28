# R2 Cleanup (Orphan Objects)

This folder contains a maintenance script to delete **orphan** files in Cloudflare R2 (files that are **not referenced** by the database).

## What counts as referenced
- `Work.coverKey` / `Work.coverImage`
- `ComicPage.imageKey` / `ComicPage.imageUrl`
- `MediaObject.key` / `MediaObject.url` (comment attachments)

## Run (from `apps/web`)

Dry run (default):
```bash
npx tsx scripts/r2-cleanup-orphans.ts
```

Execute delete:
```bash
npx tsx scripts/r2-cleanup-orphans.ts --execute
```

Limit deletions (safety):
```bash
npx tsx scripts/r2-cleanup-orphans.ts --execute --limit-deletes 50
```

Scan only a prefix (example):
```bash
npx tsx scripts/r2-cleanup-orphans.ts --dry-run --prefix users/ --prefix media/
```

Reduce the "in-flight" protection window (default 360 minutes):
```bash
npx tsx scripts/r2-cleanup-orphans.ts --execute --min-age-minutes 30
```

## Required ENV
The script uses the same ENV as the web app (`R2_ENDPOINT`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_PUBLIC_BASE_URL`) plus `DATABASE_URL`.

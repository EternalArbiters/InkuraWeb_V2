import { PrismaClient } from "@prisma/client";
import { ListObjectsV2Command, DeleteObjectCommand, type ListObjectsV2CommandOutput } from "@aws-sdk/client-s3";

import { getR2Client, getR2Env, tryExtractKeyFromUrl } from "../server/storage/r2";

/**
 * Cleanup orphan objects in Cloudflare R2.
 *
 * What counts as "referenced":
 * - Work.coverKey / Work.coverImage
 * - ComicPage.imageKey / ComicPage.imageUrl
 * - MediaObject.key / MediaObject.url (comment attachments)
 *
 * Usage examples (run inside apps/web):
 *   npx tsx scripts/r2-cleanup-orphans.ts
 *   npx tsx scripts/r2-cleanup-orphans.ts --dry-run
 *   npx tsx scripts/r2-cleanup-orphans.ts --execute
 *   npx tsx scripts/r2-cleanup-orphans.ts --execute --prefix users/ --prefix media/
 *   npx tsx scripts/r2-cleanup-orphans.ts --execute --min-age-minutes 30
 *
 * Notes:
 * - Default is DRY RUN.
 * - We skip deleting objects newer than minAgeMinutes (default 360) to avoid deleting in-flight uploads.
 */

type Args = {
  execute: boolean;
  prefixes: string[];
  minAgeMinutes: number;
  limitDeletes: number | null;
  verbose: boolean;
};

function parseArgs(argv: string[]): Args {
  const out: Args = {
    execute: false,
    prefixes: [],
    minAgeMinutes: 360,
    limitDeletes: null,
    verbose: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--execute" || a === "--apply") out.execute = true;
    else if (a === "--dry-run") out.execute = false;
    else if (a === "--verbose" || a === "-v") out.verbose = true;
    else if (a === "--prefix") {
      const v = argv[i + 1];
      if (v) {
        out.prefixes.push(v);
        i++;
      }
    } else if (a === "--min-age-minutes") {
      const v = Number(argv[i + 1]);
      if (Number.isFinite(v) && v >= 0) out.minAgeMinutes = v;
      i++;
    } else if (a === "--limit-deletes") {
      const v = Number(argv[i + 1]);
      if (Number.isFinite(v) && v > 0) out.limitDeletes = Math.floor(v);
      i++;
    }
  }

  return out;
}

function nowMs() {
  return Date.now();
}

function toKeyMaybe(v: string | null | undefined): string | null {
  if (!v) return null;
  return tryExtractKeyFromUrl(v);
}

function bytes(n: number) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let x = n;
  let idx = 0;
  while (x >= 1024 && idx < units.length - 1) {
    x /= 1024;
    idx++;
  }
  return `${x.toFixed(idx === 0 ? 0 : 2)} ${units[idx]}`;
}

async function buildReferencedKeySet(prisma: PrismaClient) {
  const keys = new Set<string>();

  const [works, pages, media] = await Promise.all([
    prisma.work.findMany({ select: { coverKey: true, coverImage: true } }),
    prisma.comicPage.findMany({ select: { imageKey: true, imageUrl: true } }),
    prisma.mediaObject.findMany({ select: { key: true, url: true } }),
  ]);

  for (const w of works) {
    const k1 = toKeyMaybe(w.coverKey);
    if (k1) keys.add(k1);
    const k2 = toKeyMaybe(w.coverImage);
    if (k2) keys.add(k2);
  }

  for (const p of pages) {
    const k1 = toKeyMaybe(p.imageKey);
    if (k1) keys.add(k1);
    const k2 = toKeyMaybe(p.imageUrl);
    if (k2) keys.add(k2);
  }

  for (const m of media) {
    const k1 = toKeyMaybe(m.key);
    if (k1) keys.add(k1);
    const k2 = toKeyMaybe(m.url);
    if (k2) keys.add(k2);
  }

  return keys;
}

async function listAllObjects(params: { prefix?: string }) {
  const env = getR2Env();
  const client = getR2Client();

  let token: string | undefined = undefined;
  const out: { key: string; size: number; lastModified?: Date }[] = [];

  do {
    const res: ListObjectsV2CommandOutput = await client.send(
      new ListObjectsV2Command({
        Bucket: env.bucket,
        Prefix: params.prefix || undefined,
        ContinuationToken: token,
        MaxKeys: 1000,
      })
    );

    const contents = res.Contents || [];
    for (const obj of contents) {
      if (!obj.Key) continue;
      out.push({
        key: obj.Key,
        size: obj.Size ?? 0,
        lastModified: obj.LastModified,
      });
    }

    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);

  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const env = getR2Env();
  const client = getR2Client();

  const prefixes = args.prefixes.length ? args.prefixes : [""]; // default: whole bucket

  console.log("[r2-cleanup] Bucket:", env.bucket);
  console.log("[r2-cleanup] Mode:", args.execute ? "EXECUTE" : "DRY RUN");
  console.log("[r2-cleanup] Prefixes:", prefixes.map((p) => (p ? p : "(all)")).join(", "));
  console.log("[r2-cleanup] minAgeMinutes:", args.minAgeMinutes);
  if (args.limitDeletes) console.log("[r2-cleanup] limitDeletes:", args.limitDeletes);

  const prisma = new PrismaClient();
  await prisma.$connect();

  const referenced = await buildReferencedKeySet(prisma);
  console.log("[r2-cleanup] Referenced keys in DB:", referenced.size);

  const cutoffMs = nowMs() - args.minAgeMinutes * 60 * 1000;

  let scanned = 0;
  let scannedBytes = 0;

  let candidates: { key: string; size: number; lastModified?: Date }[] = [];

  for (const prefix of prefixes) {
    const objs = await listAllObjects({ prefix: prefix || undefined });
    scanned += objs.length;
    scannedBytes += objs.reduce((a, b) => a + (b.size || 0), 0);

    for (const o of objs) {
      if (referenced.has(o.key)) continue;

      // Skip "young" objects (possible in-flight uploads)
      if (o.lastModified) {
        const t = o.lastModified.getTime();
        if (t > cutoffMs) continue;
      }

      candidates.push(o);
    }
  }

  // de-dup in case prefixes overlap
  const seen = new Set<string>();
  candidates = candidates.filter((c) => {
    if (seen.has(c.key)) return false;
    seen.add(c.key);
    return true;
  });

  candidates.sort((a, b) => (b.size || 0) - (a.size || 0));

  const totalCandidateBytes = candidates.reduce((a, b) => a + (b.size || 0), 0);

  console.log("[r2-cleanup] Objects scanned:", scanned, `(${bytes(scannedBytes)})`);
  console.log("[r2-cleanup] Orphan candidates:", candidates.length, `(${bytes(totalCandidateBytes)})`);

  if (args.verbose) {
    console.log("[r2-cleanup] Top candidates:");
    for (const c of candidates.slice(0, 25)) {
      console.log(`  - ${c.key}  (${bytes(c.size || 0)})  ${c.lastModified?.toISOString?.() || ""}`);
    }
    if (candidates.length > 25) console.log(`  ...and ${candidates.length - 25} more`);
  }

  if (!args.execute) {
    console.log("[r2-cleanup] Dry run complete. Re-run with --execute to delete.");
    await prisma.$disconnect();
    return;
  }

  const limit = args.limitDeletes ?? candidates.length;
  const toDelete = candidates.slice(0, limit);

  console.log("[r2-cleanup] Deleting:", toDelete.length);

  // Delete with small concurrency to avoid throttling.
  const concurrency = 5;
  let idx = 0;
  let deleted = 0;
  let deletedBytes = 0;

  async function worker() {
    while (true) {
      const cur = idx++;
      if (cur >= toDelete.length) return;
      const item = toDelete[cur];
      try {
        await client.send(new DeleteObjectCommand({ Bucket: env.bucket, Key: item.key }));
        deleted++;
        deletedBytes += item.size || 0;
        if (args.verbose) console.log("[r2-cleanup] deleted", item.key);
      } catch (e) {
        console.error("[r2-cleanup] FAILED to delete", item.key);
        console.error(e);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }).map(() => worker()));

  console.log("[r2-cleanup] Deleted:", deleted, `(${bytes(deletedBytes)})`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("[r2-cleanup] FAILED:");
  console.error(err);
  process.exit(1);
});

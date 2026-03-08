import { deleteObjects, listAllObjects, type ListedObject } from "../server/storage/r2";
import {
  buildReferenceKeySet,
  collectStorageReferences,
  hasFlag,
  matchesScopeFilter,
  normalizeScope,
  parseCliArgs,
  prefixListForScope,
  readNumberArg,
  readStringArg,
  summarizeBytes,
  withPrisma,
} from "./storageBackfill";

async function listManagedBucketObjects(scope: ReturnType<typeof normalizeScope>, hardLimit?: number) {
  const prefixes = prefixListForScope(scope);
  const all: ListedObject[] = [];
  for (const prefix of prefixes) {
    const remaining = hardLimit ? Math.max(0, hardLimit - all.length) : undefined;
    if (remaining === 0) break;
    const page = await listAllObjects({ prefix, hardLimit: remaining });
    all.push(...page.filter((object) => matchesScopeFilter(object.key, scope)));
  }
  return all;
}

async function main() {
  const args = parseCliArgs(process.argv.slice(2));
  const scope = normalizeScope(readStringArg(args, "scope", "all"));
  const apply = hasFlag(args, "apply");
  const json = hasFlag(args, "json");
  const hardLimit = readNumberArg(args, "hard-limit");
  const deleteLimit = readNumberArg(args, "delete-limit", 250) ?? 250;
  const olderThanDays = readNumberArg(args, "older-than-days", 14) ?? 14;
  const cutoff = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;

  const refs = await withPrisma((prisma) => collectStorageReferences(prisma, scope));
  const referencedKeys = buildReferenceKeySet(refs);
  const bucketObjects = await listManagedBucketObjects(scope, hardLimit);
  const orphanObjects = bucketObjects.filter((object) => !referencedKeys.has(object.key));
  const eligible = orphanObjects.filter((object) => !object.lastModified || object.lastModified.getTime() <= cutoff);
  const toDelete = eligible.slice(0, deleteLimit);

  const summary = {
    scope,
    apply,
    olderThanDays,
    bucketObjectCount: bucketObjects.length,
    orphanObjectCount: orphanObjects.length,
    eligibleCount: eligible.length,
    deleteCount: toDelete.length,
    totalBytes: toDelete.reduce((sum, object) => sum + object.size, 0),
    keys: toDelete.map((object) => ({ key: object.key, size: object.size, lastModified: object.lastModified })),
  };

  if (apply && toDelete.length) {
    await deleteObjects(toDelete.map((object) => object.key));
  }

  if (json) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  console.log(`[storage:cleanup] scope=${scope} apply=${apply ? "yes" : "no"} olderThanDays=${olderThanDays}`);
  console.log(
    `[storage:cleanup] bucketObjects=${summary.bucketObjectCount} orphanObjects=${summary.orphanObjectCount} eligible=${summary.eligibleCount} deleteCount=${summary.deleteCount}`
  );
  console.log(`[storage:cleanup] bytes=${summarizeBytes(summary.totalBytes)}`);
  for (const object of toDelete.slice(0, 50)) {
    console.log(`  - ${apply ? "deleted" : "candidate"} ${object.key} (${summarizeBytes(object.size)})`);
  }
  if (!apply) {
    console.log("[storage:cleanup] dry-run only. Re-run with --apply after reviewing the candidate list.");
  }
}

main().catch((error) => {
  console.error("[storage:cleanup] FAILED");
  console.error(error);
  process.exit(1);
});

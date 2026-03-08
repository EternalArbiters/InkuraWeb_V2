import { headObject, listAllObjects, type ListedObject } from "../server/storage/r2";
import {
  buildReferenceKeySet,
  collectStorageReferences,
  hasFlag,
  matchesScopeFilter,
  normalizeScope,
  parseCliArgs,
  prefixListForScope,
  printScopeSummary,
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
    const objects = await listAllObjects({ prefix, hardLimit: remaining });
    all.push(...objects.filter((object) => matchesScopeFilter(object.key, scope)));
  }
  return all;
}

async function main() {
  const args = parseCliArgs(process.argv.slice(2));
  const scope = normalizeScope(readStringArg(args, "scope", "all"));
  const skipR2 = hasFlag(args, "skip-r2");
  const json = hasFlag(args, "json");
  const hardLimit = readNumberArg(args, "hard-limit");
  const headLimit = readNumberArg(args, "head-limit", 20) ?? 20;

  const refs = await withPrisma((prisma) => collectStorageReferences(prisma, scope));

  let bucketObjects: ListedObject[] | undefined;
  if (!skipR2) {
    bucketObjects = await listManagedBucketObjects(scope, hardLimit);
  }

  const referencedKeys = buildReferenceKeySet(refs);
  const bucketKeySet = new Set((bucketObjects || []).map((object) => object.key));

  const missingObjects = bucketObjects
    ? refs.filter((ref) => !bucketKeySet.has(ref.key))
    : [];
  const orphanObjects = bucketObjects
    ? bucketObjects.filter((object) => !referencedKeys.has(object.key))
    : [];

  const largestRefs = [...refs]
    .sort((left, right) => Number(right.sizeBytes || 0) - Number(left.sizeBytes || 0))
    .slice(0, 10)
    .map((ref) => ({
      scope: ref.scope,
      key: ref.key,
      label: ref.label,
      sizeBytes: ref.sizeBytes || null,
    }));

  const headChecks = [] as Array<{ key: string; exists: boolean; contentLength?: number; contentType?: string }>;
  if (!skipR2) {
    for (const ref of refs.slice(0, headLimit)) {
      const head = await headObject(ref.key);
      headChecks.push({ key: ref.key, exists: head.exists, contentLength: head.contentLength, contentType: head.contentType });
    }
  }

  const payload = {
    scope,
    referenceCount: refs.length,
    bucketObjectCount: bucketObjects?.length ?? null,
    missingObjectCount: missingObjects.length,
    orphanObjectCount: orphanObjects.length,
    largestRefs,
    headChecks,
    missingObjects: missingObjects.slice(0, 50).map((ref) => ({ scope: ref.scope, key: ref.key, label: ref.label })),
    orphanObjects: orphanObjects.slice(0, 50).map((object) => ({ key: object.key, size: object.size, lastModified: object.lastModified })),
  };

  if (json) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  console.log(`[storage:audit] scope=${scope}`);
  printScopeSummary({ refs, bucketObjects });

  console.log(`[storage:audit] missing objects: ${missingObjects.length}`);
  for (const ref of missingObjects.slice(0, 20)) {
    console.log(`  - missing ${ref.scope} ${ref.key} (${ref.label})`);
  }

  console.log(`[storage:audit] orphan objects: ${orphanObjects.length}`);
  for (const object of orphanObjects.slice(0, 20)) {
    console.log(`  - orphan ${object.key} (${summarizeBytes(object.size)})`);
  }

  if (headChecks.length) {
    console.log(`[storage:audit] sample HEAD checks (${headChecks.length} refs):`);
    for (const head of headChecks) {
      console.log(
        `  - ${head.exists ? "ok" : "missing"} ${head.key}${head.contentLength ? ` ${summarizeBytes(head.contentLength)}` : ""}${head.contentType ? ` ${head.contentType}` : ""}`
      );
    }
  }

  if (largestRefs.length) {
    console.log("[storage:audit] largest DB-backed refs with recorded size:");
    for (const ref of largestRefs) {
      console.log(`  - ${ref.scope} ${ref.key} (${ref.sizeBytes ? summarizeBytes(ref.sizeBytes) : "unknown"})`);
    }
  }

  console.log("[storage:audit] done");
}

main().catch((error) => {
  console.error("[storage:audit] FAILED");
  console.error(error);
  process.exit(1);
});

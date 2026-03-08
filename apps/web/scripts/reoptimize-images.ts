import sharp from "sharp";
import { getTargetImageDimensions } from "../lib/uploadOptimization";
import { getObjectBuffer, putBuffer, deleteObject, headObject, publicUrlForKey } from "../server/storage/r2";
import {
  canReoptimizeScope,
  collectStorageReferences,
  hasFlag,
  makeBackfillKey,
  normalizeScope,
  optimizationProfileForScope,
  parseCliArgs,
  readNumberArg,
  readStringArg,
  shouldAllowApplyForReference,
  summarizeBytes,
  updateReferenceKey,
  withPrisma,
  type BackfillScope,
  type StorageReference,
} from "./storageBackfill";

function chooseOutputContentType(params: { scope: BackfillScope; sourceContentType: string; hasAlpha: boolean }) {
  const profile = optimizationProfileForScope(params.scope);
  if (params.sourceContentType === "image/gif") return "image/gif";
  if (params.hasAlpha && profile.preserveAlpha) return "image/webp";
  return profile.preferredContentType || params.sourceContentType || "image/webp";
}

async function optimizeReference(ref: StorageReference) {
  const profile = optimizationProfileForScope(ref.scope);
  const source = await getObjectBuffer(ref.key);
  if (!source.exists || !source.buffer) {
    return { status: "missing" as const, ref };
  }

  const metadata = await sharp(source.buffer, { animated: false }).rotate().metadata();
  const width = Number(metadata.width || 0);
  const height = Number(metadata.height || 0);
  if (!width || !height) {
    return { status: "invalid" as const, ref, reason: "missing-dimensions" };
  }

  const hasAlpha = Boolean(metadata.hasAlpha);
  const outputContentType = chooseOutputContentType({
    scope: ref.scope,
    sourceContentType: String(source.contentType || ref.contentType || "image/webp").toLowerCase(),
    hasAlpha,
  });

  const target = getTargetImageDimensions({ scope: ref.scope, width, height });

  let pipeline = sharp(source.buffer, { animated: false }).rotate().resize({
    width: target.width || undefined,
    height: target.height || undefined,
    fit: ref.scope === "covers" ? "cover" : "inside",
    withoutEnlargement: true,
  });

  if (outputContentType === "image/webp") {
    pipeline = pipeline.webp({ quality: Math.round((profile.quality || 0.82) * 100), effort: 4 });
  } else if (outputContentType === "image/png") {
    pipeline = pipeline.png({ compressionLevel: 9 });
  } else if (outputContentType === "image/jpeg") {
    pipeline = pipeline.jpeg({ quality: Math.round((profile.quality || 0.82) * 100), mozjpeg: true });
  }

  const optimizedBuffer = await pipeline.toBuffer();
  const outputMeta = await sharp(optimizedBuffer).metadata();
  const optimizedBytes = optimizedBuffer.length;
  const originalBytes = Number(source.contentLength || source.buffer.length || 0);

  return {
    status: "ready" as const,
    ref,
    originalBytes,
    optimizedBytes,
    originalContentType: source.contentType || ref.contentType || null,
    optimizedContentType: outputContentType,
    width: Number(outputMeta.width || width),
    height: Number(outputMeta.height || height),
    buffer: optimizedBuffer,
    bytesSaved: originalBytes - optimizedBytes,
    percentSaved: originalBytes > 0 ? (originalBytes - optimizedBytes) / originalBytes : 0,
  };
}

async function main() {
  const args = parseCliArgs(process.argv.slice(2));
  const scope = normalizeScope(readStringArg(args, "scope", "all"));
  const limit = readNumberArg(args, "limit");
  const minBytesSaved = readNumberArg(args, "min-bytes-saved", 64 * 1024) ?? 64 * 1024;
  const minPercentSaved = readNumberArg(args, "min-percent-saved", 0.1) ?? 0.1;
  const apply = hasFlag(args, "apply");
  const deleteOld = hasFlag(args, "delete-old");
  const json = hasFlag(args, "json");
  const versionTag = readStringArg(args, "version-tag", "reopt-v1") || "reopt-v1";

  if (scope !== "all" && !canReoptimizeScope(scope)) {
    throw new Error(`Scope ${scope} is audit-only for PR 6. Use storage:audit for comment media.`);
  }

  const refs = await withPrisma((prisma) => collectStorageReferences(prisma, scope));
  const candidateRefs = refs.filter((ref) => canReoptimizeScope(ref.scope));
  const sliced = limit ? candidateRefs.slice(0, limit) : candidateRefs;
  const results = [] as Array<Record<string, unknown>>;

  await withPrisma(async (prisma) => {
    for (const ref of sliced) {
      const result = await optimizeReference(ref);
      if (result.status !== "ready") {
        results.push({ key: ref.key, scope: ref.scope, status: result.status, reason: (result as any).reason || null });
        continue;
      }

      const worthwhile = result.bytesSaved >= minBytesSaved && result.percentSaved >= minPercentSaved;
      const nextKey = makeBackfillKey({ originalKey: ref.key, contentType: result.optimizedContentType, versionTag });
      const nextUrl = publicUrlForKey(nextKey);
      const payload = {
        key: ref.key,
        nextKey,
        scope: ref.scope,
        label: ref.label,
        status: worthwhile ? (apply ? "applied" : "candidate") : "skip-not-worthwhile",
        originalBytes: result.originalBytes,
        optimizedBytes: result.optimizedBytes,
        bytesSaved: result.bytesSaved,
        percentSaved: Number((result.percentSaved * 100).toFixed(2)),
        originalContentType: result.originalContentType,
        optimizedContentType: result.optimizedContentType,
        width: result.width,
        height: result.height,
      };

      if (!worthwhile) {
        results.push(payload);
        continue;
      }

      if (!apply) {
        results.push(payload);
        continue;
      }

      if (!shouldAllowApplyForReference(ref)) {
        results.push({ ...payload, status: "skip-apply-not-supported" });
        continue;
      }

      const existing = await headObject(nextKey);
      if (!existing.exists) {
        await putBuffer({ key: nextKey, buffer: result.buffer, contentType: result.optimizedContentType });
      }
      await updateReferenceKey(prisma, ref, {
        key: nextKey,
        url: nextUrl,
        contentType: result.optimizedContentType,
        sizeBytes: result.optimizedBytes,
      });
      if (deleteOld) {
        await deleteObject(ref.key).catch(() => {});
      }
      results.push(payload);
    }
  });

  const summary = {
    scope,
    processed: sliced.length,
    apply,
    deleteOld,
    candidateCount: results.filter((item) => item.status === "candidate").length,
    appliedCount: results.filter((item) => item.status === "applied").length,
    skippedCount: results.filter((item) => String(item.status).startsWith("skip")).length,
    totalOriginalBytes: results.reduce((sum, item) => sum + Number(item.originalBytes || 0), 0),
    totalOptimizedBytes: results.reduce((sum, item) => sum + Number(item.optimizedBytes || 0), 0),
    totalBytesSaved: results.reduce((sum, item) => sum + Number(item.bytesSaved || 0), 0),
    results,
  };

  if (json) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  console.log(`[storage:reoptimize] scope=${scope} apply=${apply ? "yes" : "no"} deleteOld=${deleteOld ? "yes" : "no"}`);
  console.log(`[storage:reoptimize] processed=${summary.processed} candidates=${summary.candidateCount} applied=${summary.appliedCount} skipped=${summary.skippedCount}`);
  console.log(
    `[storage:reoptimize] bytes original=${summarizeBytes(summary.totalOriginalBytes)} optimized=${summarizeBytes(summary.totalOptimizedBytes)} saved=${summarizeBytes(summary.totalBytesSaved)}`
  );

  for (const item of results.slice(0, 50)) {
    const original = Number(item.originalBytes || 0);
    const optimized = Number(item.optimizedBytes || 0);
    console.log(
      `  - ${item.status} ${item.scope} ${item.key}${original ? ` ${summarizeBytes(original)} -> ${summarizeBytes(optimized)}` : ""}`
    );
  }

  if (!apply) {
    console.log("[storage:reoptimize] dry-run only. Re-run with --apply after reviewing the report.");
  }
}

main().catch((error) => {
  console.error("[storage:reoptimize] FAILED");
  console.error(error);
  process.exit(1);
});

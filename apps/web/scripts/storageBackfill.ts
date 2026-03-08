import crypto from "crypto";
import path from "path";
import { PrismaClient, MediaObjectType } from "@prisma/client";
import { getUploadProfile, isOptimizableUploadScope, type UploadOptimizationScope } from "../lib/uploadProfiles";
import { publicUrlForKey, safeFilename, tryExtractKeyFromUrl, type ListedObject } from "../server/storage/r2";

export type BackfillScope = Extract<UploadOptimizationScope, "avatar" | "covers" | "pages" | "comment_images" | "comment_gifs">;
export type ManagedStorageScope = BackfillScope | "all";

export type StorageReferenceKind = "user-avatar" | "work-cover" | "chapter-thumbnail" | "comic-page" | "media-object";

export type StorageReference = {
  scope: BackfillScope;
  kind: StorageReferenceKind;
  entityId: string;
  key: string;
  url: string | null;
  label: string;
  contentType?: string | null;
  sizeBytes?: number | null;
  sha256?: string | null;
  createdAt?: Date | null;
};

export type ParsedCliArgs = {
  flags: Set<string>;
  values: Record<string, string>;
  positionals: string[];
};

export function parseCliArgs(argv: string[]): ParsedCliArgs {
  const flags = new Set<string>();
  const values: Record<string, string> = {};
  const positionals: string[] = [];

  for (const raw of argv) {
    if (!raw.startsWith("--")) {
      positionals.push(raw);
      continue;
    }
    const body = raw.slice(2);
    const eqIndex = body.indexOf("=");
    if (eqIndex >= 0) {
      values[body.slice(0, eqIndex)] = body.slice(eqIndex + 1);
      continue;
    }
    flags.add(body);
  }

  return { flags, values, positionals };
}

export function readStringArg(args: ParsedCliArgs, name: string, fallback?: string) {
  return args.values[name] ?? fallback;
}

export function readNumberArg(args: ParsedCliArgs, name: string, fallback?: number) {
  const value = args.values[name];
  if (value == null) return fallback;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) throw new Error(`Invalid number for --${name}: ${value}`);
  return numeric;
}

export function hasFlag(args: ParsedCliArgs, name: string) {
  return args.flags.has(name);
}

export function normalizeScope(value: string | undefined, fallback: ManagedStorageScope = "all"): ManagedStorageScope {
  const next = String(value || fallback).trim().toLowerCase();
  if (next === "all") return "all";
  if (next === "avatar" || next === "covers" || next === "pages" || next === "comment_images" || next === "comment_gifs") {
    return next;
  }
  throw new Error(`Unsupported scope: ${value}`);
}

export function summarizeBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }
  return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

export function inferScopeFromKey(key: string): BackfillScope | null {
  const normalized = String(key || "").toLowerCase();
  if (!normalized) return null;
  if (normalized.startsWith("media/comment/image/")) return "comment_images";
  if (normalized.startsWith("media/comment/gif/")) return "comment_gifs";
  if (normalized.includes("/covers/")) return "covers";
  if (normalized.includes("/pages/")) return "pages";
  if (normalized.includes("/files/") && normalized.includes("avatar-")) return "avatar";
  return null;
}

export function inferExtensionFromContentType(contentType: string | null | undefined) {
  const normalized = String(contentType || "").toLowerCase();
  if (normalized === "image/webp") return "webp";
  if (normalized === "image/png") return "png";
  if (normalized === "image/jpeg") return "jpg";
  if (normalized === "image/gif") return "gif";
  return "bin";
}

export function inferPublicUrlForKeySafely(key: string) {
  try {
    return publicUrlForKey(key);
  } catch {
    return null;
  }
}

export function makeBackfillKey(params: {
  originalKey: string;
  contentType: string;
  versionTag?: string;
}) {
  const versionTag = params.versionTag || "reopt-v1";
  const extension = inferExtensionFromContentType(params.contentType);
  const directory = path.posix.dirname(params.originalKey);
  const currentBase = path.posix.basename(params.originalKey);
  const stem = currentBase.replace(/\.[a-z0-9]+$/i, "");
  const cleanedStem = stem.replace(/\.reopt-v\d+$/i, "");
  return `${directory}/${cleanedStem}.${versionTag}.${extension}`;
}

export function isCandidateForManagedCleanup(key: string) {
  const normalized = String(key || "").toLowerCase();
  return normalized.startsWith("users/") || normalized.startsWith("media/comment/");
}

export function matchesScopeFilter(key: string, scope: ManagedStorageScope) {
  if (scope === "all") return isCandidateForManagedCleanup(key);
  return inferScopeFromKey(key) === scope;
}

export function prefixListForScope(scope: ManagedStorageScope): string[] {
  if (scope === "comment_images") return ["media/comment/image/"];
  if (scope === "comment_gifs") return ["media/comment/gif/"];
  return ["users/"];
}

export async function collectStorageReferences(prisma: PrismaClient, scope: ManagedStorageScope = "all") {
  const refs: StorageReference[] = [];
  const includeScope = (candidate: BackfillScope) => scope === "all" || scope === candidate;

  if (includeScope("avatar")) {
    const users = await prisma.user.findMany({
      where: { image: { not: null } },
      select: { id: true, username: true, image: true },
    });
    for (const user of users) {
      const key = tryExtractKeyFromUrl(user.image);
      if (!key) continue;
      refs.push({
        scope: "avatar",
        kind: "user-avatar",
        entityId: user.id,
        key,
        url: user.image,
        label: user.username ? `@${user.username}` : user.id,
      });
    }
  }

  if (includeScope("covers")) {
    const works = await prisma.work.findMany({
      where: { OR: [{ coverKey: { not: null } }, { coverImage: { not: null } }] },
      select: { id: true, title: true, coverKey: true, coverImage: true },
    });
    for (const work of works) {
      const key = work.coverKey || tryExtractKeyFromUrl(work.coverImage);
      if (!key) continue;
      refs.push({
        scope: "covers",
        kind: "work-cover",
        entityId: work.id,
        key,
        url: work.coverImage || inferPublicUrlForKeySafely(key),
        label: work.title,
      });
    }
  }

  if (includeScope("pages")) {
    const thumbnails = await prisma.chapter.findMany({
      where: { OR: [{ thumbnailKey: { not: null } }, { thumbnailImage: { not: null } }] },
      select: { id: true, title: true, thumbnailKey: true, thumbnailImage: true },
    });
    for (const chapter of thumbnails) {
      const key = chapter.thumbnailKey || tryExtractKeyFromUrl(chapter.thumbnailImage);
      if (!key) continue;
      refs.push({
        scope: "pages",
        kind: "chapter-thumbnail",
        entityId: chapter.id,
        key,
        url: chapter.thumbnailImage || inferPublicUrlForKeySafely(key),
        label: chapter.title,
      });
    }

    const pages = await prisma.comicPage.findMany({
      select: { id: true, chapterId: true, order: true, imageKey: true, imageUrl: true },
    });
    for (const page of pages) {
      const key = page.imageKey || tryExtractKeyFromUrl(page.imageUrl);
      if (!key) continue;
      refs.push({
        scope: "pages",
        kind: "comic-page",
        entityId: page.id,
        key,
        url: page.imageUrl || inferPublicUrlForKeySafely(key),
        label: `chapter:${page.chapterId}#${page.order}`,
      });
    }
  }

  if (includeScope("comment_images") || includeScope("comment_gifs")) {
    const mediaObjects = await prisma.mediaObject.findMany({
      select: { id: true, type: true, sha256: true, contentType: true, sizeBytes: true, key: true, url: true, createdAt: true },
    });
    for (const media of mediaObjects) {
      const refScope = media.type === MediaObjectType.COMMENT_GIF ? "comment_gifs" : "comment_images";
      if (scope !== "all" && scope !== refScope) continue;
      refs.push({
        scope: refScope,
        kind: "media-object",
        entityId: media.id,
        key: media.key,
        url: media.url,
        label: media.sha256,
        contentType: media.contentType,
        sizeBytes: media.sizeBytes,
        sha256: media.sha256,
        createdAt: media.createdAt,
      });
    }
  }

  return refs;
}

export function buildReferenceKeySet(refs: StorageReference[]) {
  return new Set(refs.map((ref) => ref.key));
}

export function groupReferencesByScope(refs: StorageReference[]) {
  const result: Record<BackfillScope, StorageReference[]> = {
    avatar: [],
    covers: [],
    pages: [],
    comment_images: [],
    comment_gifs: [],
  };
  for (const ref of refs) result[ref.scope].push(ref);
  return result;
}

export function groupObjectsByScope(objects: ListedObject[]) {
  const result: Record<BackfillScope | "unknown", ListedObject[]> = {
    avatar: [],
    covers: [],
    pages: [],
    comment_images: [],
    comment_gifs: [],
    unknown: [],
  };
  for (const object of objects) {
    const scope = inferScopeFromKey(object.key);
    if (scope) result[scope].push(object);
    else result.unknown.push(object);
  }
  return result;
}

export async function updateReferenceKey(
  prisma: PrismaClient,
  ref: StorageReference,
  next: { key: string; url: string; contentType?: string; sizeBytes?: number }
) {
  if (ref.kind === "user-avatar") {
    await prisma.user.update({ where: { id: ref.entityId }, data: { image: next.url } });
    return;
  }
  if (ref.kind === "work-cover") {
    await prisma.work.update({ where: { id: ref.entityId }, data: { coverKey: next.key, coverImage: next.url } });
    return;
  }
  if (ref.kind === "chapter-thumbnail") {
    await prisma.chapter.update({ where: { id: ref.entityId }, data: { thumbnailKey: next.key, thumbnailImage: next.url } });
    return;
  }
  if (ref.kind === "comic-page") {
    await prisma.comicPage.update({ where: { id: ref.entityId }, data: { imageKey: next.key, imageUrl: next.url } });
    return;
  }
  if (ref.kind === "media-object") {
    throw new Error(
      "MediaObject backfill is audit-only by default because sha256-backed dedupe requires a dedicated migration plan."
    );
  }
  throw new Error(`Unsupported reference kind: ${ref.kind}`);
}

export function shouldAllowApplyForReference(ref: StorageReference) {
  return ref.kind !== "media-object";
}

export function makeReoptimizedFilenameHint(ref: StorageReference, contentType: string) {
  const ext = inferExtensionFromContentType(contentType);
  const labelStem = safeFilename(ref.label || ref.entityId) || ref.entityId;
  const idPart = crypto.randomUUID();
  return `${labelStem}-${idPart}.${ext}`;
}

export function printScopeSummary(params: {
  refs: StorageReference[];
  bucketObjects?: ListedObject[];
}) {
  const refsByScope = groupReferencesByScope(params.refs);
  console.log("[storage] DB references:");
  (Object.keys(refsByScope) as BackfillScope[]).forEach((scope) => {
    const totalBytes = refsByScope[scope].reduce((sum, ref) => sum + Number(ref.sizeBytes || 0), 0);
    console.log(`  - ${scope}: ${refsByScope[scope].length} refs${totalBytes ? ` (${summarizeBytes(totalBytes)})` : ""}`);
  });

  if (params.bucketObjects) {
    const objectsByScope = groupObjectsByScope(params.bucketObjects);
    console.log("[storage] Bucket objects:");
    (["avatar", "covers", "pages", "comment_images", "comment_gifs", "unknown"] as const).forEach((scope) => {
      const items = objectsByScope[scope];
      const totalBytes = items.reduce((sum, item) => sum + item.size, 0);
      console.log(`  - ${scope}: ${items.length} objects (${summarizeBytes(totalBytes)})`);
    });
  }
}

export async function withPrisma<T>(fn: (prisma: PrismaClient) => Promise<T>) {
  const prisma = new PrismaClient();
  try {
    return await fn(prisma);
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

export function optimizationProfileForScope(scope: BackfillScope) {
  return getUploadProfile(scope);
}

export function canReoptimizeScope(scope: BackfillScope) {
  return isOptimizableUploadScope(scope) && scope !== "comment_images" && scope !== "comment_gifs";
}

import "server-only";

import prisma from "@/server/db/prisma";
import { getSession } from "@/server/auth/session";
import { apiRoute, json } from "@/server/http";
import { logWarn } from "@/server/observability/logger";
import { enforceRateLimitOrResponse } from "@/server/rate-limit/response";
import { headObject, makeObjectKey, presignPutObject, publicUrlForKey } from "@/server/storage/r2";
import {
  extFromUploadContentType,
  isAllowedUploadContentType,
  makeCommentMediaObjectKey,
  maxBytesForUploadScope,
  normalizeSha256,
  normalizeUploadContentType,
  normalizeUploadScope,
} from "@/server/uploads/presignRules";
import { buildUploadGuardrailMeta, readUploadOptimizationMeta, validateUploadOptimizationMeta } from "@/server/uploads/imageValidation";

export const runtime = "nodejs";

async function canEditWork(userId: string, role: string, workId: string) {
  if (role === "ADMIN") return true;
  const w = await prisma.work.findUnique({ where: { id: workId }, select: { authorId: true } });
  return !!w && w.authorId === userId;
}

async function canEditChapter(userId: string, role: string, chapterId: string) {
  if (role === "ADMIN") return true;
  const ch = await prisma.chapter.findUnique({ where: { id: chapterId }, select: { work: { select: { authorId: true } } } });
  return !!ch && ch.work.authorId === userId;
}

export const POST = apiRoute(async (req: Request) => {
  const session = await getSession();
  if (!session?.user?.id) return json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({} as any));
  const scope = normalizeUploadScope(body?.scope ?? body?.kind);

  const limited = await enforceRateLimitOrResponse({
    req,
    policyName: scope === "pages" ? "upload.presign.pages" : "upload.presign",
    userId: session.user.id,
  });
  if (limited) return limited;

  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (!me) return json({ error: "Unauthorized" }, { status: 401 });

  const filename = String(body?.filename || "upload").trim();
  const contentType = normalizeUploadContentType(filename, String(body?.contentType || body?.type || "").trim());
  const size = Number(body?.size ?? 0);
  const workId = body?.workId ? String(body.workId) : undefined;
  const chapterId = body?.chapterId ? String(body.chapterId) : undefined;
  const optimizationMeta = readUploadOptimizationMeta(body?.optimization ?? body?.uploadOptimization ?? body?.meta);

  if (!filename) return json({ error: "filename is required" }, { status: 400 });
  if (!isAllowedUploadContentType(scope, contentType)) return json({ error: "Unsupported file type" }, { status: 400 });
  const maxBytes = maxBytesForUploadScope(scope);
  if (size && size > maxBytes) return json({ error: `File too large (max ${Math.floor(maxBytes / (1024 * 1024))}MB)` }, { status: 400 });

  let validation;
  try {
    validation = validateUploadOptimizationMeta({ scope, contentType, sizeBytes: size, meta: optimizationMeta });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Invalid upload optimization metadata" }, { status: 400 });
  }

  if (validation.warnings.length) {
    logWarn("upload.presign_guardrail_warning", { userId: session.user.id, ...buildUploadGuardrailMeta({ scope, contentType, sizeBytes: size, validation }) });
  }

  if (scope === "covers" && workId && !(await canEditWork(session.user.id, me.role, workId))) return json({ error: "Forbidden" }, { status: 403 });
  if (scope === "pages") {
    if (chapterId) {
      if (!(await canEditChapter(session.user.id, me.role, chapterId))) return json({ error: "Forbidden" }, { status: 403 });
    } else if (workId) {
      if (!(await canEditWork(session.user.id, me.role, workId))) return json({ error: "Forbidden" }, { status: 403 });
    } else {
      return json({ error: "chapterId or workId is required for pages" }, { status: 400 });
    }
  }

  const isCommentMedia = scope === "comment_images" || scope === "comment_gifs";
  let key: string;
  let sha256: string | null = null;

  if (isCommentMedia) {
    sha256 = normalizeSha256(body?.sha256 ?? body?.hash);
    if (!sha256) return json({ error: "sha256 is required for comment media" }, { status: 400 });
    const ext = extFromUploadContentType(contentType, filename);
    key = makeCommentMediaObjectKey({ sha256, scope: scope as any, ext });
    const exists = await headObject(key);
    if (exists.exists) return json({ ok: true, exists: true, sha256, key, publicUrl: publicUrlForKey(key) });
  } else {
    key = makeObjectKey({ userId: session.user.id, workId, chapterId, scope: scope as any, filename });
  }

  const signed = await presignPutObject({ key, contentType });
  return json({ ok: true, exists: false, sha256, uploadUrl: signed.uploadUrl, key: signed.key, publicUrl: signed.publicUrl });
});

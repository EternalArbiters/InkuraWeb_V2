import prisma from "@/server/db/prisma";
import { getSession } from "@/server/auth/session";
import { apiRoute, json } from "@/server/http";
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

export const runtime = "nodejs";

// NOTE (v16 prep): comment media presign supports SHA-256 de-dup keys.
// - comment_images: image/webp|png|jpeg (2MB)
// - comment_gifs: image/gif (5MB)
// If the object already exists in R2 (same sha256), we return exists=true and NO uploadUrl.

async function canEditWork(userId: string, role: string, workId: string) {
  if (role === "ADMIN") return true;
  const w = await prisma.work.findUnique({ where: { id: workId }, select: { authorId: true } });
  if (!w) return false;
  return w.authorId === userId;
}

async function canEditChapter(userId: string, role: string, chapterId: string) {
  if (role === "ADMIN") return true;
  const ch = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: { work: { select: { authorId: true } } },
  });
  if (!ch) return false;
  return ch.work.authorId === userId;
}

export const POST = apiRoute(async (req: Request) => {
  const session = await getSession();
  if (!session?.user?.id) return json({ error: "Unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (!me) return json({ error: "Unauthorized" }, { status: 401 });

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const scope = normalizeUploadScope(body?.scope ?? body?.kind);
  const filename = String(body?.filename || "upload").trim();
  const contentType = normalizeUploadContentType(filename, String(body?.contentType || body?.type || "").trim());
  const size = Number(body?.size ?? 0);
  const workId = body?.workId ? String(body.workId) : undefined;
  const chapterId = body?.chapterId ? String(body.chapterId) : undefined;

  if (!filename) return json({ error: "filename is required" }, { status: 400 });

  // Guardrails (cost & abuse prevention)
  if (!isAllowedUploadContentType(scope, contentType)) {
    return json({ error: "Unsupported file type" }, { status: 400 });
  }
  const maxBytes = maxBytesForUploadScope(scope);
  if (size && size > maxBytes) {
    return json({ error: `File too large (max ${Math.floor(maxBytes / (1024 * 1024))}MB)` }, { status: 400 });
  }

  // Ownership checks (covers/pages)
  if (scope === "covers") {
    if (!workId) return json({ error: "workId is required for covers" }, { status: 400 });
    const ok = await canEditWork(session.user.id, me.role, workId);
    if (!ok) return json({ error: "Forbidden" }, { status: 403 });
  }

  if (scope === "pages") {
    // Prefer chapterId (more strict), but allow workId fallback.
    if (chapterId) {
      const ok = await canEditChapter(session.user.id, me.role, chapterId);
      if (!ok) return json({ error: "Forbidden" }, { status: 403 });
    } else if (workId) {
      const ok = await canEditWork(session.user.id, me.role, workId);
      if (!ok) return json({ error: "Forbidden" }, { status: 403 });
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

    // De-dup: if already exists in R2, do NOT issue a new presign.
    const exists = await headObject(key);
    if (exists.exists) {
      return json({ ok: true, exists: true, sha256, key, publicUrl: publicUrlForKey(key) });
    }
  } else {
    key = makeObjectKey({ userId: session.user.id, workId, chapterId, scope: scope as any, filename });
  }

  const signed = await presignPutObject({ key, contentType });

  return json({
    ok: true,
    exists: false,
    sha256,
    uploadUrl: signed.uploadUrl,
    key: signed.key,
    publicUrl: signed.publicUrl,
  });
});

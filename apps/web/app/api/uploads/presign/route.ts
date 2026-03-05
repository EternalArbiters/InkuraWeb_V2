import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/server/db/prisma";
import { authOptions } from "@/server/auth/options";
import { headObject, makeObjectKey, presignPutObject, publicUrlForKey, safeFilename } from "@/server/storage/r2";

export const runtime = "nodejs";

// NOTE (v16 prep): comment media presign supports SHA-256 de-dup keys.
// - comment_images: image/webp|png|jpeg (2MB)
// - comment_gifs: image/gif (5MB)
// If the object already exists in R2 (same sha256), we return exists=true and NO uploadUrl.

type Scope = "covers" | "pages" | "files" | "comment_images" | "comment_gifs";

function safeScope(v: unknown): Scope {
  const s = String(v || "files").toLowerCase().replace(/\s+/g, "");
  if (s === "covers" || s === "cover") return "covers";
  if (s === "pages" || s === "page") return "pages";

  // Comment media (v16)
  if (s === "comment_images" || s === "commentimage" || s === "commentimages" || s === "comment-image" || s === "comment-images") {
    return "comment_images";
  }
  if (s === "comment_gifs" || s === "commentgif" || s === "commentgifs" || s === "comment-gif" || s === "comment-gifs") {
    return "comment_gifs";
  }

  return "files";
}

function guessContentType(filename: string) {
  const n = filename.toLowerCase();
  if (n.endsWith(".webp")) return "image/webp";
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  if (n.endsWith(".gif")) return "image/gif";
  if (n.endsWith(".pdf")) return "application/pdf";
  return "application/octet-stream";
}

function normalizeContentType(filename: string, ct: string) {
  const v = (ct || "").trim();
  return v ? v : guessContentType(filename);
}

function isAllowedContentType(scope: Scope, ct: string) {
  const c = ct.toLowerCase();
  if (scope === "covers" || scope === "pages" || scope === "comment_images") {
    return c === "image/webp" || c === "image/png" || c === "image/jpeg";
  }
  if (scope === "comment_gifs") {
    return c === "image/gif";
  }
  // files scope: allow pdf for now (expand later if needed)
  return c === "application/pdf" || c === "application/octet-stream";
}

function maxBytesForScope(scope: Scope) {
  if (scope === "covers") return 2 * 1024 * 1024; // 2MB
  if (scope === "pages") return 5 * 1024 * 1024; // 5MB
  if (scope === "comment_images") return 2 * 1024 * 1024; // 2MB
  if (scope === "comment_gifs") return 5 * 1024 * 1024; // 5MB (requested)
  return 20 * 1024 * 1024; // 20MB
}

function normalizeSha256(v: unknown): string | null {
  const s = String(v || "").trim().toLowerCase();
  if (!s) return null;
  if (!/^[a-f0-9]{64}$/.test(s)) return null;
  return s;
}

function extFromContentType(ct: string, filename: string) {
  const c = ct.toLowerCase();
  if (c === "image/gif") return "gif";
  if (c === "image/png") return "png";
  if (c === "image/webp") return "webp";
  if (c === "image/jpeg") return "jpg";
  // fallback: from filename
  const safe = safeFilename(filename);
  const parts = safe.split(".");
  const last = parts.length > 1 ? parts[parts.length - 1] : "bin";
  return last || "bin";
}

function makeCommentMediaKey(params: { sha256: string; scope: "comment_images" | "comment_gifs"; ext: string }) {
  if (params.scope === "comment_gifs") return `media/comment/gif/${params.sha256}.gif`;
  return `media/comment/image/${params.sha256}.${params.ext}`;
}

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

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const scope = safeScope(body?.scope ?? body?.kind);
  const filename = String(body?.filename || "upload").trim();
  const contentType = normalizeContentType(filename, String(body?.contentType || body?.type || "").trim());
  const size = Number(body?.size ?? 0);
  const workId = body?.workId ? String(body.workId) : undefined;
  const chapterId = body?.chapterId ? String(body.chapterId) : undefined;

  if (!filename) return NextResponse.json({ error: "filename is required" }, { status: 400 });

  // Guardrails (cost & abuse prevention)
  if (!isAllowedContentType(scope, contentType)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }
  const maxBytes = maxBytesForScope(scope);
  if (size && size > maxBytes) {
    return NextResponse.json({ error: `File too large (max ${Math.floor(maxBytes / (1024 * 1024))}MB)` }, { status: 400 });
  }

  // Ownership checks (covers/pages)
  if (scope === "covers") {
    if (!workId) return NextResponse.json({ error: "workId is required for covers" }, { status: 400 });
    const ok = await canEditWork(session.user.id, me.role, workId);
    if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (scope === "pages") {
    // Prefer chapterId (more strict), but allow workId fallback.
    if (chapterId) {
      const ok = await canEditChapter(session.user.id, me.role, chapterId);
      if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    } else if (workId) {
      const ok = await canEditWork(session.user.id, me.role, workId);
      if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    } else {
      return NextResponse.json({ error: "chapterId or workId is required for pages" }, { status: 400 });
    }
  }

  const isCommentMedia = scope === "comment_images" || scope === "comment_gifs";

  let key: string;
  let sha256: string | null = null;

  if (isCommentMedia) {
    sha256 = normalizeSha256(body?.sha256 ?? body?.hash);
    if (!sha256) return NextResponse.json({ error: "sha256 is required for comment media" }, { status: 400 });
    const ext = extFromContentType(contentType, filename);
    key = makeCommentMediaKey({ sha256, scope: scope as any, ext });

    // De-dup: if already exists in R2, do NOT issue a new presign.
    const exists = await headObject(key);
    if (exists.exists) {
      return NextResponse.json({ ok: true, exists: true, sha256, key, publicUrl: publicUrlForKey(key) });
    }
  } else {
    key = makeObjectKey({ userId: session.user.id, workId, chapterId, scope: scope as any, filename });
  }

  const signed = await presignPutObject({ key, contentType });

  return NextResponse.json({
    ok: true,
    exists: false,
    sha256,
    uploadUrl: signed.uploadUrl,
    key: signed.key,
    publicUrl: signed.publicUrl,
  });
}

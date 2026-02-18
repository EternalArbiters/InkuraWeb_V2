import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { makeObjectKey, presignPutObject } from "@/server/storage/r2";

export const runtime = "nodejs";

type Scope = "covers" | "pages" | "files";

function safeScope(v: unknown): Scope {
  const s = String(v || "files").toLowerCase();
  if (s === "covers" || s === "cover") return "covers";
  if (s === "pages" || s === "page") return "pages";
  return "files";
}

function guessContentType(filename: string) {
  const n = filename.toLowerCase();
  if (n.endsWith(".webp")) return "image/webp";
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  if (n.endsWith(".pdf")) return "application/pdf";
  return "application/octet-stream";
}

function normalizeContentType(filename: string, ct: string) {
  const v = (ct || "").trim();
  return v ? v : guessContentType(filename);
}

function isAllowedContentType(scope: Scope, ct: string) {
  const c = ct.toLowerCase();
  if (scope === "covers" || scope === "pages") {
    return c === "image/webp" || c === "image/png" || c === "image/jpeg";
  }
  // files scope: allow pdf for now (expand later if needed)
  return c === "application/pdf" || c === "application/octet-stream";
}

function maxBytesForScope(scope: Scope) {
  if (scope === "covers") return 2 * 1024 * 1024; // 2MB
  if (scope === "pages") return 5 * 1024 * 1024; // 5MB
  return 20 * 1024 * 1024; // 20MB
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

  const key = makeObjectKey({
    userId: session.user.id,
    workId,
    chapterId,
    scope,
    filename,
  });

  const uploadUrl = await presignPutObject({
    key,
    contentType,
  });

  const publicUrl = process.env.R2_PUBLIC_BASE_URL
    ? `${process.env.R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${key}`
    : key;

  return NextResponse.json({ ok: true, uploadUrl, key, publicUrl });
}

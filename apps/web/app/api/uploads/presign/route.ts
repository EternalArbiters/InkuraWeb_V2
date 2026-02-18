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
  const contentType = String(body?.contentType || body?.type || "application/octet-stream").trim();
  const workId = body?.workId ? String(body.workId) : undefined;
  const chapterId = body?.chapterId ? String(body.chapterId) : undefined;

  if (!filename) return NextResponse.json({ error: "filename is required" }, { status: 400 });

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

  try {
    const signed = await presignPutObject({ key, contentType });
    return NextResponse.json({ ok: true, ...signed });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Presign failed" }, { status: 500 });
  }
}

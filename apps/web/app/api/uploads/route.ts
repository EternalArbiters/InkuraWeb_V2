import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { deleteObject } from "@/server/storage/r2";

export const runtime = "nodejs";

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

// Optional helper endpoint (v13): delete an R2 object by key.
// NOTE: prefer to delete through specific resources (cover/page delete). This is for cleanup tools.
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({} as any));
  const key = String(body?.key || "").trim();
  const workId = body?.workId ? String(body.workId) : undefined;
  const chapterId = body?.chapterId ? String(body.chapterId) : undefined;

  if (!key) return NextResponse.json({ error: "key is required" }, { status: 400 });

  // Permission: must specify scope context so we can enforce ownership.
  if (chapterId) {
    const ok = await canEditChapter(session.user.id, me.role, chapterId);
    if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } else if (workId) {
    const ok = await canEditWork(session.user.id, me.role, workId);
    if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } else if (me.role !== "ADMIN") {
    return NextResponse.json({ error: "workId/chapterId required (or admin)" }, { status: 400 });
  }

  await deleteObject(key);
  return NextResponse.json({ ok: true });
}

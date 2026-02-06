import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({} as any));
  const workId = String(body?.workId || "");
  const chapterId = String(body?.chapterId || "");
  const progress = body?.progress == null ? null : Number(body.progress);
  if (!workId || !chapterId) {
    return NextResponse.json({ error: "workId and chapterId required" }, { status: 400 });
  }

  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: { id: true, workId: true },
  });
  if (!chapter || chapter.workId !== workId) {
    return NextResponse.json({ error: "Chapter mismatch" }, { status: 400 });
  }

  await prisma.readingProgress.upsert({
    where: { userId_workId: { userId: session.user.id, workId } },
    update: {
      chapterId,
      lastReadAt: new Date(),
      progress: progress != null && Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : undefined,
    },
    create: {
      userId: session.user.id,
      workId,
      chapterId,
      progress: progress != null && Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : undefined,
    },
  });

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(_req: Request, { params }: { params: Promise<{ workId: string }> }) {
  const { workId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const work = await prisma.work.findUnique({ where: { id: workId }, select: { id: true } });
  if (!work) return NextResponse.json({ error: "Work not found" }, { status: 404 });

  const userId = session.user.id;

  try {
    const existing = await prisma.bookmark.findUnique({
      where: { userId_workId: { userId, workId } },
    });

    if (existing) {
      await prisma.bookmark.delete({ where: { userId_workId: { userId, workId } } });
      return NextResponse.json({ ok: true, bookmarked: false });
    }

    await prisma.bookmark.create({ data: { userId, workId } });
    return NextResponse.json({ ok: true, bookmarked: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

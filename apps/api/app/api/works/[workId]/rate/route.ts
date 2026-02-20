import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

function clampRating(v: number) {
  if (!Number.isFinite(v)) return null;
  const n = Math.round(v);
  if (n < 1 || n > 5) return null;
  return n;
}

export async function POST(req: Request, { params }: { params: Promise<{ workId: string }> }) {
  const { workId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({} as any));
  const value = clampRating(Number(body?.value));
  if (!value) {
    return NextResponse.json({ error: "value must be 1..5" }, { status: 400 });
  }

  const userId = session.user.id;

  const work = await prisma.work.findUnique({ where: { id: workId }, select: { id: true } });
  if (!work) return NextResponse.json({ error: "Work not found" }, { status: 404 });

  try {
    await prisma.workRating.upsert({
      where: { userId_workId: { userId, workId } },
      update: { value },
      create: { userId, workId, value },
    });

    const agg = await prisma.workRating.aggregate({
      where: { workId },
      _avg: { value: true },
      _count: { value: true },
    });

    const ratingAvg = Number(agg._avg.value ?? 0);
    const ratingCount = Number(agg._count.value ?? 0);

    await prisma.work.update({
      where: { id: workId },
      data: { ratingAvg, ratingCount },
    });

    return NextResponse.json({ ok: true, myRating: value, ratingAvg, ratingCount });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

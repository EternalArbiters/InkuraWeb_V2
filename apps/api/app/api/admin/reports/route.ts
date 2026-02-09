import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const reports = await prisma.report.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      reporter: { select: { id: true, username: true, name: true, image: true } },
    },
  });

  const commentIds = Array.from(new Set(reports.map((r) => r.targetId))).filter(Boolean);
  const comments = commentIds.length
    ? await prisma.comment.findMany({
        where: { id: { in: commentIds } },
        select: {
          id: true,
          body: true,
          isHidden: true,
          createdAt: true,
          user: { select: { id: true, username: true, name: true, image: true } },
          chapter: { select: { id: true, title: true, number: true, work: { select: { id: true, title: true, slug: true } } } },
        },
      })
    : [];
  const commentMap = new Map(comments.map((c) => [c.id, c]));

  return NextResponse.json({
    ok: true,
    reports: reports.map((r) => ({
      ...r,
      comment: commentMap.get(r.targetId) || null,
    })),
  });
}

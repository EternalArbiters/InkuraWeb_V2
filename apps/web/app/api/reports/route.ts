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
  const targetType = String(body?.targetType || "COMMENT").toUpperCase();
  const targetId = String(body?.targetId || "").trim();
  const reason = String(body?.reason || "").trim();

  if (targetType !== "COMMENT") {
    return NextResponse.json({ error: "Only COMMENT reports supported" }, { status: 400 });
  }
  if (!targetId || !reason) {
    return NextResponse.json({ error: "targetId and reason are required" }, { status: 400 });
  }
  if (reason.length > 500) {
    return NextResponse.json({ error: "Reason too long" }, { status: 400 });
  }

  const comment = await prisma.comment.findUnique({ where: { id: targetId }, select: { id: true } });
  if (!comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  const report = await prisma.report.create({
    data: {
      reporterId: session.user.id,
      targetType: "COMMENT" as any,
      targetId,
      reason,
    },
  });

  return NextResponse.json({ ok: true, report }, { status: 201 });
}

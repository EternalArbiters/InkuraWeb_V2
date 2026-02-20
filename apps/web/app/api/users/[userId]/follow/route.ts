import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(_req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const targetId = String(userId || "");
  if (!targetId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }
  if (targetId === session.user.id) {
    return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
  }

  const existing = await prisma.followUser.findUnique({
    where: { followerId_followingId: { followerId: session.user.id, followingId: targetId } },
  });

  if (existing) {
    await prisma.followUser.delete({
      where: { followerId_followingId: { followerId: session.user.id, followingId: targetId } },
    });
    return NextResponse.json({ ok: true, following: false });
  }

  await prisma.followUser.create({
    data: { followerId: session.user.id, followingId: targetId },
  });

  return NextResponse.json({ ok: true, following: true });
}

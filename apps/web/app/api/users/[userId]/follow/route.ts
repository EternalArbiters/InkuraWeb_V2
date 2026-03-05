import prisma from "@/server/db/prisma";
import { getSession } from "@/server/auth/session";
import { apiRoute, json } from "@/server/http";

export const POST = apiRoute(async (_req: Request, { params }: { params: Promise<{ userId: string }> }) => {
  const { userId } = await params;
  const session = await getSession();
  if (!session?.user?.id) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const targetId = String(userId || "");
  if (!targetId) {
    return json({ error: "userId required" }, { status: 400 });
  }
  if (targetId === session.user.id) {
    return json({ error: "Cannot follow yourself" }, { status: 400 });
  }

  const existing = await prisma.followUser.findUnique({
    where: { followerId_followingId: { followerId: session.user.id, followingId: targetId } },
  });

  if (existing) {
    await prisma.followUser.delete({
      where: { followerId_followingId: { followerId: session.user.id, followingId: targetId } },
    });
    return json({ ok: true, following: false });
  }

  await prisma.followUser.create({
    data: { followerId: session.user.id, followingId: targetId },
  });

  return json({ ok: true, following: true });
});

import "server-only";

import prisma from "@/server/db/prisma";
import { getSession } from "@/server/auth/session";
import { apiRoute, json } from "@/server/http";
import { revalidatePublicProfile } from "@/server/cache/publicContent";

export const POST = apiRoute(async (_req: Request, { params }: { params: Promise<{ userId: string }> }) => {
  const { userId } = await params;
  const session = await getSession();
  if (!session?.user?.id) return json({ error: "Unauthorized" }, { status: 401 });

  const targetId = String(userId || "");
  if (!targetId) return json({ error: "userId required" }, { status: 400 });
  if (targetId === session.user.id) return json({ error: "Cannot block yourself" }, { status: 400 });

  const [targetUser, existing] = await Promise.all([
    prisma.user.findUnique({ where: { id: targetId }, select: { id: true, username: true } }),
    prisma.userBlock.findUnique({ where: { blockerId_blockedId: { blockerId: session.user.id, blockedId: targetId } }, select: { blockerId: true } }),
  ]);

  if (!targetUser) return json({ error: "User not found" }, { status: 404 });

  if (existing) {
    await prisma.userBlock.delete({ where: { blockerId_blockedId: { blockerId: session.user.id, blockedId: targetId } } });
    revalidatePublicProfile(targetUser.username);
    return json({ ok: true, blocked: false });
  }

  await prisma.$transaction([
    prisma.userBlock.create({ data: { blockerId: session.user.id, blockedId: targetId } }),
    prisma.followUser.deleteMany({
      where: {
        OR: [
          { followerId: session.user.id, followingId: targetId },
          { followerId: targetId, followingId: session.user.id },
        ],
      },
    }),
  ]);

  revalidatePublicProfile(targetUser.username);
  return json({ ok: true, blocked: true });
});

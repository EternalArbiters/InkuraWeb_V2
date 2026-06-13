import "server-only";

import prisma from "@/server/db/prisma";
import { getSession } from "@/server/auth/session";
import { apiRoute, json, unauthorized, badRequest, notFound } from "@/server/http";
import { revalidatePublicProfile } from "@/server/cache/publicContent";

export const POST = apiRoute(async (_req: Request, { params }: { params: Promise<{ userId: string }> }) => {
  const { userId } = await params;
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();

  const targetId = String(userId || "");
  if (!targetId) return badRequest("userId required");
  if (targetId === session.user.id) return badRequest("Cannot block yourself");

  const [targetUser, existing] = await Promise.all([
    prisma.user.findUnique({ where: { id: targetId }, select: { id: true, username: true } }),
    prisma.userBlock.findUnique({ where: { blockerId_blockedId: { blockerId: session.user.id, blockedId: targetId } }, select: { blockerId: true } }),
  ]);

  if (!targetUser) return notFound("User not found");

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

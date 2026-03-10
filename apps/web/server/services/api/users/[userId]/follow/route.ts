import "server-only";

import prisma from "@/server/db/prisma";
import { getSession } from "@/server/auth/session";
import { apiRoute, json } from "@/server/http";
import { enforceRateLimitOrResponse } from "@/server/rate-limit/response";

export const POST = apiRoute(async (req: Request, { params }: { params: Promise<{ userId: string }> }) => {
  const { userId } = await params;
  const session = await getSession();
  if (!session?.user?.id) return json({ error: "Unauthorized" }, { status: 401 });
  const limited = await enforceRateLimitOrResponse({ req, policyName: "user.follow", userId: session.user.id });
  if (limited) return limited;

  const targetId = String(userId || "");
  if (!targetId) return json({ error: "userId required" }, { status: 400 });
  if (targetId === session.user.id) return json({ error: "Cannot follow yourself" }, { status: 400 });

  const existing = await prisma.followUser.findUnique({ where: { followerId_followingId: { followerId: session.user.id, followingId: targetId } } });
  if (existing) {
    await prisma.followUser.delete({ where: { followerId_followingId: { followerId: session.user.id, followingId: targetId } } });
    return json({ ok: true, following: false });
  }
  await prisma.followUser.create({ data: { followerId: session.user.id, followingId: targetId } });
  return json({ ok: true, following: true });
});

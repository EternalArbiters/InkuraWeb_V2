import "server-only";

import prisma from "@/server/db/prisma";
import { getSession } from "@/server/auth/session";
import { apiRoute, json } from "@/server/http";

export const runtime = "nodejs";

export const GET = apiRoute(async () => {
  const session = await getSession();
  if (!session?.user?.id) return json({ count: 0 });
  const count = await prisma.notification.count({ where: { userId: session.user.id, isRead: false } });
  return json({ count });
});

import prisma from "@/server/db/prisma";
import { getSession } from "@/server/auth/session";
import { apiRoute, json } from "@/server/http";

export const GET = apiRoute(async () => {
  const session = await getSession();
  if (!session?.user?.id) {
    return json({ unreadCount: 0, notifications: [] });
  }

  const [unreadCount, notifications] = await Promise.all([
    prisma.notification.count({ where: { userId: session.user.id, isRead: false } }),
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return json({ unreadCount, notifications });
});

export const POST = apiRoute(async (req: Request) => {
  const session = await getSession();
  if (!session?.user?.id) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({} as any));
  const markAll = !!body?.markAll;
  const id = body?.id ? String(body.id) : null;

  if (markAll) {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true },
    });
    return json({ ok: true, markAll: true });
  }

  if (!id) {
    return json({ error: "id required" }, { status: 400 });
  }

  await prisma.notification.updateMany({
    where: { id, userId: session.user.id },
    data: { isRead: true },
  });

  return json({ ok: true });
});

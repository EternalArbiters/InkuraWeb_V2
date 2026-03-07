import "server-only";

import prisma from "@/server/db/prisma";
import { getSession } from "@/server/auth/session";
import { apiRoute, json } from "@/server/http";
import { listViewerNotifications, readViewerNotificationsParams } from "@/server/services/notifications/viewerNotifications";

export const GET = apiRoute(async (req: Request) => {
  const session = await getSession();
  if (!session?.user?.id) {
    return json({ unreadCount: 0, notifications: [], nextCursor: null });
  }

  const data = await listViewerNotifications(readViewerNotificationsParams(req));
  return json(data);
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

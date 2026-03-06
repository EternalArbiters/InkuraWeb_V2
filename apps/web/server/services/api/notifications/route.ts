import "server-only";

import prisma from "@/server/db/prisma";
import { parseCursor, parseTake, nextCursorFromRows } from "@/server/db/pagination";
import { notificationSelect } from "@/server/db/selectors";
import { getSession } from "@/server/auth/session";
import { json } from "@/server/http";

export const GET = async (req: Request) => {
  const session = await getSession();
  if (!session?.user?.id) {
    return json({ unreadCount: 0, notifications: [], nextCursor: null });
  }

  const url = new URL(req.url);
  const take = parseTake(url.searchParams, { def: 20, min: 1, max: 50 });
  const cursor = parseCursor(url.searchParams);

  const query: any = {
    where: { userId: session.user.id },
    orderBy: [{ createdAt: "desc" as const }, { id: "desc" as const }],
    take,
    select: notificationSelect,
  };

  if (cursor) {
    query.cursor = { id: cursor };
    query.skip = 1;
  }

  const [unreadCount, notifications] = await Promise.all([
    prisma.notification.count({ where: { userId: session.user.id, isRead: false } }),
    prisma.notification.findMany(query),
  ]);

  const nextCursor = nextCursorFromRows(notifications as any, take);

  return json({ unreadCount, notifications, nextCursor });
};
export const POST = async (req: Request) => {
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
};

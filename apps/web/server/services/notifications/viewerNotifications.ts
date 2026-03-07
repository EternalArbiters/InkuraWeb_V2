import "server-only";

import prisma from "@/server/db/prisma";
import { parseCursor, parseTake, nextCursorFromRows } from "@/server/db/pagination";
import { notificationSelect } from "@/server/db/selectors";
import { requireSessionUserId } from "@/server/http/auth";

export async function listViewerNotifications(input?: {
  take?: number;
  cursor?: string | null;
}) {
  const userId = await requireSessionUserId();
  const take = Math.min(50, Math.max(1, Number(input?.take ?? 20) || 20));
  const cursor = input?.cursor ? String(input.cursor) : null;

  const query: any = {
    where: { userId },
    orderBy: [{ createdAt: "desc" as const }, { id: "desc" as const }],
    take,
    select: notificationSelect,
  };

  if (cursor) {
    query.cursor = { id: cursor };
    query.skip = 1;
  }

  const [unreadCount, notifications] = await Promise.all([
    prisma.notification.count({ where: { userId, isRead: false } }),
    prisma.notification.findMany(query),
  ]);

  const nextCursor = nextCursorFromRows(notifications as any, take);
  return { unreadCount, notifications, nextCursor };
}

export function readViewerNotificationsParams(req: Request) {
  const url = new URL(req.url);
  return {
    take: parseTake(url.searchParams, { def: 20, min: 1, max: 50 }),
    cursor: parseCursor(url.searchParams),
  };
}

import "server-only";

import prisma from "@/server/db/prisma";
import { getViewerBasic } from "@/server/services/works/viewer";

type ConnectionKind = "followers" | "following";

const userSelect = {
  id: true,
  username: true,
  name: true,
  image: true,
  bio: true,
  avatarFocusX: true,
  avatarFocusY: true,
  avatarZoom: true,
} as const;

function mapConnection(kind: ConnectionKind, row: any) {
  return {
    createdAt: row.createdAt,
    user: kind === "followers" ? row.follower : row.following,
  };
}

async function loadConnections(userId: string, kind: ConnectionKind) {
  const rows = await prisma.followUser.findMany({
    where: kind === "followers" ? { followingId: userId } : { followerId: userId },
    orderBy: { createdAt: "desc" },
    select:
      kind === "followers"
        ? { createdAt: true, follower: { select: userSelect } }
        : { createdAt: true, following: { select: userSelect } },
  });

  return rows.map((row) => mapConnection(kind, row));
}

export async function getViewerConnectionsPageData(userId: string, kind: ConnectionKind) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, name: true },
  });

  if (!user) return null;

  const items = await loadConnections(userId, kind);
  return { user, items, kind };
}

export async function getPublicConnectionsPageData(username: string, kind: ConnectionKind) {
  const [viewer, user] = await Promise.all([
    getViewerBasic(),
    prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true, name: true },
    }),
  ]);

  if (!user) return null;

  const items = await loadConnections(user.id, kind);
  return { user, items, kind, viewer };
}

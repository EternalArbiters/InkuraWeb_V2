import "server-only";

import prisma from "@/server/db/prisma";
import { requireSessionUserId } from "@/server/http/auth";
import { ApiError } from "@/server/http";

const viewerProfileSelect = {
  id: true,
  email: true,
  username: true,
  name: true,
  image: true,
  avatarFocusX: true,
  avatarFocusY: true,
  avatarZoom: true,
  role: true,
  createdAt: true,
} as const;

export async function getViewerProfile() {
  const userId = await requireSessionUserId();
  const profile = await prisma.user.findUnique({
    where: { id: userId },
    select: viewerProfileSelect,
  });

  if (!profile) {
    throw new ApiError(404, "Not found");
  }

  return { profile };
}

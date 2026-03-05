import "server-only";

import prisma from "@/server/db/prisma";

export async function getCreatorRole(sessionUserId: string) {
  return prisma.user.findUnique({ where: { id: sessionUserId }, select: { role: true } });
}

export function isOwnerOrAdmin(role: string, userId: string, ownerId: string) {
  return role === "ADMIN" || userId === ownerId;
}

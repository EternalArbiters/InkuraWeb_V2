import "server-only";

export function isOwnerOrAdmin(role: string, userId: string, ownerId: string) {
  return role === "ADMIN" || userId === ownerId;
}

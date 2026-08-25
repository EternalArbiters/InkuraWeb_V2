import "server-only";

import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import prisma from "@/server/db/prisma";
import { toJsonSafe } from "@/server/http";

// v30: roles an admin is allowed to hand out through this panel. ADMIN is
// deliberately excluded — server/auth/adminEmail.ts's reconcileRole() would just
// demote it back to USER on that account's next login (it only ever force-asserts
// ADMIN for the one hardcoded email), so allowing it here would be a confusing dead end.
const ASSIGNABLE_ROLES = ["USER", "SPECIAL_USER"] as const;
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

export function isAssignableRole(value: unknown): value is AssignableRole {
  return typeof value === "string" && (ASSIGNABLE_ROLES as readonly string[]).includes(value);
}

export type CreateAdminUserInput = {
  adminId: string;
  email: string;
  username: string;
  password: string;
  name?: string | null;
  role: AssignableRole;
  ip?: string | null;
  userAgent?: string | null;
};

export async function createAdminUser(input: CreateAdminUserInput) {
  const email = input.email.trim().toLowerCase();
  const username = input.username.trim().toLowerCase();
  const name = input.name?.trim() || null;

  if (!email || !username || !input.password) throw new Error("email, username, and password are required");
  if (input.password.length < 8) throw new Error("Password must be at least 8 characters");
  if (!isAssignableRole(input.role)) throw new Error("Invalid role");

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username: { equals: username, mode: "insensitive" } }] },
    select: { id: true },
  });
  if (existing) throw new Error("Email or username already in use");

  const hashed = await bcrypt.hash(input.password, 10);

  const created = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        username,
        name,
        password: hashed,
        role: input.role,
        adultConfirmed: false,
        image: "/images/default-avatar.png",
      },
      select: { id: true, email: true, username: true, name: true, role: true, createdAt: true },
    });
    await tx.adminAuditLog.create({
      data: {
        adminId: input.adminId,
        action: "CREATE",
        entity: "User",
        entityId: user.id,
        beforeJson: Prisma.DbNull,
        afterJson: toJsonSafe(user) as any,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
    return user;
  });

  return created;
}

export type PatchAdminUserRoleInput = {
  adminId: string;
  userId: string;
  role: AssignableRole;
  ip?: string | null;
  userAgent?: string | null;
};

export async function patchAdminUserRole(input: PatchAdminUserRoleInput) {
  if (!isAssignableRole(input.role)) throw new Error("Invalid role");

  const updated = await prisma.$transaction(async (tx) => {
    const before = await tx.user.findUnique({
      where: { id: input.userId },
      select: { id: true, email: true, username: true, role: true },
    });
    if (!before) throw new Error("User not found");
    if (before.role === "ADMIN") throw new Error("Cannot change the hardcoded admin account's role");

    const after = await tx.user.update({
      where: { id: input.userId },
      data: { role: input.role },
      select: { id: true, email: true, username: true, name: true, role: true },
    });
    await tx.adminAuditLog.create({
      data: {
        adminId: input.adminId,
        action: "UPDATE",
        entity: "User",
        entityId: after.id,
        beforeJson: toJsonSafe(before) as any,
        afterJson: toJsonSafe(after) as any,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
    return after;
  });

  return updated;
}

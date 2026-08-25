import "server-only";

import prisma from "@/server/db/prisma";
import { getSession } from "@/server/auth/session";
import { isAdminEmail } from "@/server/auth/adminEmail";

export async function requireUser() {
  const session = await getSession();
  const userId = (session as any)?.user?.id as string | undefined;
  if (!userId) throw new Error("UNAUTHORIZED");

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, email: true, username: true, name: true },
  });
  if (!me) throw new Error("UNAUTHORIZED");
  return { session, me };
}

export async function requireAdmin() {
  const { session, me } = await requireUser();
  // v14: admin access is additionally email-gated.
  if (me.role !== "ADMIN" || !isAdminEmail((me as any).email)) throw new Error("FORBIDDEN");
  return { session, me };
}

// v30: gate for "Koleksi Admin" surfaces (rail see-all page, etc.) — ADMIN or
// SPECIAL_USER. Deliberately does NOT reuse requireAdmin()'s isAdminEmail check,
// which is specific to the single hardcoded admin invariant and must not apply to
// SPECIAL_USER accounts (which can be any admin-chosen email).
export async function requireAdminOrSpecialUser() {
  const { session, me } = await requireUser();
  if (me.role !== "ADMIN" && me.role !== "SPECIAL_USER") throw new Error("FORBIDDEN");
  return { session, me };
}

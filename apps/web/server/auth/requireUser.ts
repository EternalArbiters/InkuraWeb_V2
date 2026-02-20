import "server-only";

import prisma from "@/lib/prisma";
import { getSession } from "@/server/auth/session";
import { isAdminEmail } from "@/server/auth/adminEmail";

export async function requireUser() {
  const session = await getSession();
  const userId = (session as any)?.user?.id as string | undefined;
  if (!userId) throw new Error("UNAUTHORIZED");

  const me = await prisma.user.findUnique({ where: { id: userId } });
  if (!me) throw new Error("UNAUTHORIZED");
  return { session, me };
}

export async function requireAdmin() {
  const { session, me } = await requireUser();
  // v14: admin access is additionally email-gated.
  if (me.role !== "ADMIN" || !isAdminEmail((me as any).email)) throw new Error("FORBIDDEN");
  return { session, me };
}

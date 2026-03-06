import "server-only";

import prisma from "@/server/db/prisma";
import { requireUser } from "@/server/auth/requireUser";
import { isAdminEmail } from "@/server/auth/adminEmail";
import { json } from "@/server/http";


export const GET = async () => {
  try {
    const { me } = await requireUser();
    const isAdmin = me.role === "ADMIN" && isAdminEmail((me as any).email);

    const count = isAdmin
      ? await prisma.adminInboxReport.count({ where: { status: "OPEN", adminReadAt: null } })
      : await prisma.adminInboxReport.count({ where: { reporterId: me.id, status: "OPEN" } });

    return json({ count });
  } catch {
    return json({ count: 0 });
  }
};

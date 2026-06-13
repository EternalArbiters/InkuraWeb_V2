import "server-only";

import prisma from "@/server/db/prisma";
import { requireAdminSession } from "@/server/http/auth";
import { apiRoute, json } from "@/server/http";

export const runtime = "nodejs";

export const GET = apiRoute(async () => {
  await requireAdminSession();

  const users = await prisma.user.findMany({
    where: { payoutInfoJson: { not: null } },
    select: { id: true, username: true, name: true, payoutInfoJson: true },
    orderBy: { name: "asc" },
  });

  return json({ ok: true, users });
});

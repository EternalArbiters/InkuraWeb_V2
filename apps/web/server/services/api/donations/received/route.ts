import "server-only";

import prisma from "@/server/db/prisma";
import { getSession } from "@/server/auth/session";
import { apiRoute, json, unauthorized } from "@/server/http";

export const runtime = "nodejs";

const PAGE_SIZE = 10;

export const GET = apiRoute(async (req: Request) => {
  const session = await getSession();
  const userId = (session as any)?.user?.id as string | undefined;
  if (!userId) return unauthorized("Login required");

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));

  const [donations, total] = await Promise.all([
    prisma.creatorDonation.findMany({
      where: { recipientUserId: userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        donorName: true,
        amount: true,
        currency: true,
        message: true,
        status: true,
        adminNote: true,
        forwardedAt: true,
        createdAt: true,
        donorUser: { select: { id: true, username: true, name: true } },
      },
    }),
    prisma.creatorDonation.count({ where: { recipientUserId: userId } }),
  ]);

  return json({
    ok: true,
    donations,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(total / PAGE_SIZE),
  });
});

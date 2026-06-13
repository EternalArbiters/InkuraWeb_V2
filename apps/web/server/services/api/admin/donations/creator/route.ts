import "server-only";

import prisma from "@/server/db/prisma";
import { requireAdminSession } from "@/server/http/auth";
import { apiRoute, json, badRequest } from "@/server/http";

export const runtime = "nodejs";

const PAGE_SIZE = 20;

export const GET = apiRoute(async (req: Request) => {
  await requireAdminSession();

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const status = url.searchParams.get("status") || undefined;

  const where =
    status && ["PENDING", "VERIFIED", "FORWARDED", "REJECTED"].includes(status)
      ? { status: status as any }
      : undefined;

  const [donations, total] = await Promise.all([
    prisma.creatorDonation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        donorName: true,
        amount: true,
        currency: true,
        message: true,
        proofImageUrl: true,
        status: true,
        adminNote: true,
        forwardedAt: true,
        createdAt: true,
        donorUser: { select: { id: true, username: true, name: true } },
        recipientUser: { select: { id: true, username: true, name: true } },
      },
    }),
    prisma.creatorDonation.count({ where }),
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

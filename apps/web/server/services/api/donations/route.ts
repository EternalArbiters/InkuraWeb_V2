import "server-only";

import prisma from "@/server/db/prisma";
import { getSession } from "@/server/auth/session";
import { apiRoute, json, badRequest, notFound, unauthorized } from "@/server/http";
import { sendDonationNotification } from "@/server/notifications/telegram";

export const runtime = "nodejs";

const PAGE_SIZE_USER = 10;

export const GET = apiRoute(async (req: Request) => {
  const session = await getSession();
  const userId = (session as any)?.user?.id as string | undefined;
  if (!userId) return unauthorized("Login required");

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));

  const [donations, total] = await Promise.all([
    prisma.creatorDonation.findMany({
      where: { donorUserId: userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE_USER,
      take: PAGE_SIZE_USER,
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
        recipientUser: { select: { id: true, username: true, name: true } },
      },
    }),
    prisma.creatorDonation.count({ where: { donorUserId: userId } }),
  ]);

  return json({
    ok: true,
    donations,
    total,
    page,
    pageSize: PAGE_SIZE_USER,
    totalPages: Math.ceil(total / PAGE_SIZE_USER),
  });
});

export const POST = apiRoute(async (req: Request) => {
  const session = await getSession();
  const donorUserId = (session as any)?.user?.id as string | undefined | null;

  const body = await req.json().catch(() => ({} as any));

  const recipientUserId = String(body?.recipientUserId || "").trim();
  const donorName = String(body?.donorName || "").trim().slice(0, 100);
  const amount = Number(body?.amount ?? 0);
  const currency = String(body?.currency || "IDR").trim().toUpperCase().slice(0, 8) || "IDR";
  const message = body?.message ? String(body.message).trim().slice(0, 500) : null;
  const proofImageBase64 = body?.proofImageBase64 ? String(body.proofImageBase64) : null;
  const proofImageMimeType = body?.proofImageMimeType ? String(body.proofImageMimeType) : null;

  if (!recipientUserId) return badRequest("recipientUserId is required");
  if (!donorName) return badRequest("donorName is required");
  if (!Number.isInteger(amount) || amount < 1000) return badRequest("amount must be at least 1000");

  const recipient = await prisma.user.findUnique({
    where: { id: recipientUserId },
    select: { id: true, name: true, username: true },
  });
  if (!recipient) return notFound("Recipient user not found");

  // Prevent donating to yourself
  if (donorUserId && donorUserId === recipientUserId) {
    return badRequest("Cannot donate to yourself");
  }

  const donation = await prisma.creatorDonation.create({
    data: {
      donorUserId: donorUserId || null,
      donorName,
      recipientUserId,
      amount,
      currency,
      message: message || null,
      status: "PENDING",
    },
    select: {
      id: true,
      donorName: true,
      amount: true,
      currency: true,
      message: true,
      status: true,
      createdAt: true,
    },
  });

  // Fire-and-forget — jangan block response kalau Telegram gagal
  sendDonationNotification({
    donorName,
    recipientName: recipient.name?.trim() || recipient.username?.trim() || recipientUserId,
    recipientUsername: recipient.username ?? null,
    amount,
    currency,
    message,
    proofImageBase64,
    proofImageMimeType,
    donationId: donation.id,
  }).catch(() => null);

  return json({ ok: true, donation });
});

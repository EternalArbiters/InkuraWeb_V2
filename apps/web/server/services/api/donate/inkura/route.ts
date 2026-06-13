import "server-only";

import prisma from "@/server/db/prisma";
import { getSession } from "@/server/auth/session";
import { apiRoute, json, badRequest } from "@/server/http";
import { sendInkuraDonationNotification } from "@/server/notifications/telegram";
import { ADMIN_EMAIL } from "@/server/auth/adminEmail";

export const runtime = "nodejs";

export const POST = apiRoute(async (req: Request) => {
  const session = await getSession();
  const donorUserId = (session as any)?.user?.id as string | undefined | null;

  const body = await req.json().catch(() => ({} as any));

  const donorName = String(body?.donorName || "").trim().slice(0, 100);
  const amount = Number(body?.amount || 0);
  const currency = String(body?.currency || "IDR");
  const message = String(body?.message || "").trim().slice(0, 500) || null;
  const proofImageBase64 = body?.proofImageBase64 ?? null;
  const proofImageMimeType = body?.proofImageMimeType ?? null;

  if (!donorName) return badRequest("Sender name is required");
  if (!amount || amount < 1000) return badRequest("Amount must be at least Rp 1,000");

  // Look up the Inkura owner account to use as recipient
  const owner = await prisma.user.findFirst({
    where: { email: ADMIN_EMAIL },
    select: { id: true },
  });

  if (owner) {
    await prisma.creatorDonation.create({
      data: {
        donorUserId: donorUserId || null,
        donorName,
        recipientUserId: owner.id,
        amount,
        currency,
        message,
        status: "PENDING",
      },
    });
  }

  sendInkuraDonationNotification({
    donorName,
    amount,
    currency,
    message,
    proofImageBase64,
    proofImageMimeType,
  }).catch(() => {});

  return json({ ok: true });
});

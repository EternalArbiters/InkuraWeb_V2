import "server-only";

import prisma from "@/server/db/prisma";
import { requireAdminSession } from "@/server/http/auth";
import { apiRoute, json, badRequest, notFound } from "@/server/http";

export const runtime = "nodejs";

const VALID_STATUSES = ["PENDING", "VERIFIED", "FORWARDED", "REJECTED"] as const;
type DonationStatusValue = (typeof VALID_STATUSES)[number];

export const PATCH = apiRoute(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  await requireAdminSession();

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({} as any));

  const status = String(body?.status || "").trim() as DonationStatusValue;
  const adminNote = body?.adminNote ? String(body.adminNote).trim().slice(0, 500) : null;

  if (!VALID_STATUSES.includes(status)) {
    return badRequest(`status must be one of: ${VALID_STATUSES.join(", ")}`);
  }

  const existing = await prisma.creatorDonation.findUnique({
    where: { id },
    select: { id: true, status: true, recipientUserId: true, donorName: true, amount: true, currency: true },
  });
  if (!existing) return notFound("Donation not found");

  const data: Record<string, unknown> = { status, adminNote };
  if (status === "FORWARDED" && existing.status !== "FORWARDED") {
    data.forwardedAt = new Date();
  }

  const updated = await prisma.creatorDonation.update({
    where: { id },
    data: data as any,
    select: {
      id: true,
      status: true,
      adminNote: true,
      forwardedAt: true,
      updatedAt: true,
      recipientUser: { select: { id: true, username: true, name: true } },
    },
  });

  // Notify the creator when their donation is forwarded
  if (status === "FORWARDED" && existing.status !== "FORWARDED") {
    const amountFormatted = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: existing.currency || "IDR",
      maximumFractionDigits: 0,
    }).format(existing.amount);

    await prisma.notification.create({
      data: {
        userId: existing.recipientUserId,
        type: "DONATION_RECEIVED",
        title: "You received a donation!",
        body: `${amountFormatted} from ${existing.donorName} has been forwarded to your account.`,
        href: "/studio",
        dedupeKey: `donation_forwarded:${id}`,
      },
    });
  }

  return json({ ok: true, donation: updated });
});

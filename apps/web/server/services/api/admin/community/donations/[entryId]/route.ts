import "server-only";

import { requireAdminSession } from "@/server/http/auth";
import { apiRoute, badRequest, json, notFound, readJsonObject } from "@/server/http";
import { deleteDonationEntry, updateDonationEntry } from "@/server/services/admin/community";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ entryId: string }> };

export const PATCH = apiRoute(async (req: Request, ctx: Ctx) => {
  const { userId } = await requireAdminSession();
  const { entryId } = await ctx.params;
  const body = await readJsonObject(req);

  try {
    const entry = await updateDonationEntry(userId, entryId, {
      amount: body.amount,
      currency: body.currency,
      note: body.note,
      donatedAt: body.donatedAt,
    });
    return json({ ok: true, entry });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update donation entry";
    if (
      message === "Amount must be greater than 0" ||
      message === "Invalid donation date"
    ) {
      return badRequest(message);
    }
    if (message === "Donation entry not found") return notFound(message);
    throw error;
  }
});

export const DELETE = apiRoute(async (_req: Request, ctx: Ctx) => {
  await requireAdminSession();
  const { entryId } = await ctx.params;

  try {
    const result = await deleteDonationEntry(entryId);
    return json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete donation entry";
    if (message === "Donation entry not found") return notFound(message);
    throw error;
  }
});

import "server-only";

import { requireAdminSession } from "@/server/http/auth";
import { apiRoute, badRequest, json, notFound, readJsonObject } from "@/server/http";
import { createDonationEntry } from "@/server/services/admin/community";

export const runtime = "nodejs";

export const POST = apiRoute(async (req: Request) => {
  const { userId } = await requireAdminSession();
  const body = await readJsonObject(req);

  try {
    const entry = await createDonationEntry(userId, {
      target: body.target,
      amount: body.amount,
      currency: body.currency,
      note: body.note,
      donatedAt: body.donatedAt,
    });
    return json({ ok: true, entry });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create donation entry";
    if (
      message === "Target user is required" ||
      message === "Amount must be greater than 0" ||
      message === "Invalid donation date" ||
      message === "Admin cannot be added to community donor rankings"
    ) {
      return badRequest(message);
    }
    if (message === "User not found") return notFound(message);
    throw error;
  }
});

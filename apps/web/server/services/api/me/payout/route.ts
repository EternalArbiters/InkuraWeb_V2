import "server-only";

import prisma from "@/server/db/prisma";
import { getSession } from "@/server/auth/session";
import { apiRoute, json, unauthorized, badRequest } from "@/server/http";

export const runtime = "nodejs";

export type PayoutInfo = {
  bankName: string;
  accountNumber: string;
  holderName: string;
  notes: string;
};

function parsePayoutInfo(raw: string | null): PayoutInfo {
  try {
    const parsed = JSON.parse(raw || "{}");
    return {
      bankName: String(parsed.bankName || ""),
      accountNumber: String(parsed.accountNumber || ""),
      holderName: String(parsed.holderName || ""),
      notes: String(parsed.notes || ""),
    };
  } catch {
    return { bankName: "", accountNumber: "", holderName: "", notes: "" };
  }
}

export const GET = apiRoute(async () => {
  const session = await getSession();
  const userId = (session as any)?.user?.id as string | undefined;
  if (!userId) return unauthorized();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { payoutInfoJson: true },
  });

  return json({ ok: true, payoutInfo: parsePayoutInfo(user?.payoutInfoJson ?? null) });
});

export const PATCH = apiRoute(async (req: Request) => {
  const session = await getSession();
  const userId = (session as any)?.user?.id as string | undefined;
  if (!userId) return unauthorized();

  const body = await req.json().catch(() => ({} as any));

  const bankName = String(body?.bankName || "").trim().slice(0, 100);
  const accountNumber = String(body?.accountNumber || "").trim().slice(0, 50);
  const holderName = String(body?.holderName || "").trim().slice(0, 100);
  const notes = String(body?.notes || "").trim().slice(0, 200);

  if (!bankName) return badRequest("Bank/payment method name is required");
  if (!accountNumber) return badRequest("Account number is required");
  if (!holderName) return badRequest("Account holder name is required");

  const payoutInfo: PayoutInfo = { bankName, accountNumber, holderName, notes };

  await prisma.user.update({
    where: { id: userId },
    data: { payoutInfoJson: JSON.stringify(payoutInfo) },
  });

  return json({ ok: true, payoutInfo });
});

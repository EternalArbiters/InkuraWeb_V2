import "server-only";

import { apiRoute, json, badRequest } from "@/server/http";
import { sendInkuraDonationNotification } from "@/server/notifications/telegram";

export const runtime = "nodejs";

export const POST = apiRoute(async (req: Request) => {
  const body = await req.json().catch(() => ({} as any));

  const donorName = String(body?.donorName || "").trim().slice(0, 100);
  const amount = Number(body?.amount || 0);
  const currency = String(body?.currency || "IDR");
  const message = String(body?.message || "").trim().slice(0, 500) || null;
  const proofImageBase64 = body?.proofImageBase64 ?? null;
  const proofImageMimeType = body?.proofImageMimeType ?? null;

  if (!donorName) return badRequest("Sender name is required");
  if (!amount || amount < 1000) return badRequest("Amount must be at least Rp 1,000");

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

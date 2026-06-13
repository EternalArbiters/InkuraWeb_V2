import "server-only";

import prisma from "@/server/db/prisma";
import { getSession } from "@/server/auth/session";
import { apiRoute, json, forbidden, badRequest, notFound } from "@/server/http";

export const runtime = "nodejs";

function cleanHandle(v: unknown) {
  const s = String(v || "").trim();
  if (!s) return "";
  return s.startsWith("@") ? s.slice(1) : s;
}

export const POST = apiRoute(async (req: Request) => {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return forbidden();
  }

  const body = await req.json().catch(() => ({} as any));
  const toRaw = String(body?.to || "");
  const to = cleanHandle(toRaw);
  const title = String(body?.title || "Admin message").trim() || "Admin message";
  const message = String(body?.message || body?.body || "").trim();
  const href = String(body?.href || "/notifications").trim() || "/notifications";

  if (!to) return badRequest("Target user is required");
  if (!message) return badRequest("Message is required");

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: to },
        { email: toRaw.trim() },
      ],
    },
    select: { id: true, username: true, email: true },
  });

  if (!user) {
    return notFound("User not found");
  }

  const notif = await prisma.notification.create({
    data: {
      userId: user.id,
      type: "ADMIN_MESSAGE" as any,
      title,
      body: message,
      href,
      actorId: session.user.id,
    },
    select: { id: true },
  });

  return json({ ok: true, notificationId: notif.id });
});

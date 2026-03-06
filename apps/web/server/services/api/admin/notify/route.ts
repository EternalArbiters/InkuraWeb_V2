import "server-only";

import prisma from "@/server/db/prisma";
import { getSession } from "@/server/auth/session";
import { json } from "@/server/http";


function cleanHandle(v: unknown) {
  const s = String(v || "").trim();
  if (!s) return "";
  return s.startsWith("@") ? s.slice(1) : s;
}

export const POST = async (req: Request) => {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({} as any));
  const toRaw = String(body?.to || "");
  const to = cleanHandle(toRaw);
  const title = String(body?.title || "Admin message").trim() || "Admin message";
  const message = String(body?.message || body?.body || "").trim();
  const href = String(body?.href || "/notifications").trim() || "/notifications";

  if (!to) return json({ error: "Target user is required" }, { status: 400 });
  if (!message) return json({ error: "Message is required" }, { status: 400 });

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
    return json({ error: "User not found" }, { status: 404 });
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
};

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/server/db/prisma";
import { authOptions } from "@/server/auth/options";

export const runtime = "nodejs";

function cleanHandle(v: unknown) {
  const s = String(v || "").trim();
  if (!s) return "";
  return s.startsWith("@") ? s.slice(1) : s;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({} as any));
  const toRaw = String(body?.to || "");
  const to = cleanHandle(toRaw);
  const title = String(body?.title || "Admin message").trim() || "Admin message";
  const message = String(body?.message || body?.body || "").trim();
  const href = String(body?.href || "/notifications").trim() || "/notifications";

  if (!to) return NextResponse.json({ error: "Target user is required" }, { status: 400 });
  if (!message) return NextResponse.json({ error: "Message is required" }, { status: 400 });

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
    return NextResponse.json({ error: "User not found" }, { status: 404 });
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

  return NextResponse.json({ ok: true, notificationId: notif.id });
}

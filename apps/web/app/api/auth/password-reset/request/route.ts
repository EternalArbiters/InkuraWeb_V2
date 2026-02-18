import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const identifier = String(body?.identifier || "").trim();

    // Always return ok to avoid account enumeration.
    if (!identifier) return NextResponse.json({ ok: true });

    const identifierLower = identifier.toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifierLower },
          { username: { equals: identifier, mode: "insensitive" as const } },
        ],
      },
      select: { id: true },
    });

    if (!user) return NextResponse.json({ ok: true });

    // Cleanup old tokens for this user (best-effort)
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    });

    const expose = process.env.SHOW_RESET_TOKEN === "1" || process.env.NODE_ENV !== "production";

    return NextResponse.json({
      ok: true,
      ...(expose ? { resetToken: token, expiresAt } : {}),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: true });
  }
}

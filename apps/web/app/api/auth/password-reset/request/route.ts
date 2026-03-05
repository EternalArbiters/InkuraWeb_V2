import prisma from "@/server/db/prisma";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/server/mail/resend";
import { apiRoute, json } from "@/server/http";

export const runtime = "nodejs";

function baseUrl() {
  return (
    process.env.RESET_PASSWORD_URL_BASE ||
    process.env.APP_BASE_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export const POST = apiRoute(async (req: Request) => {
  try {
    const body = await req.json().catch(() => ({} as any));
    const identifier = String(body?.identifier || "").trim();

    // Always return ok to avoid account enumeration.
    if (!identifier) return json({ ok: true });

    const identifierLower = identifier.toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifierLower },
          { username: { equals: identifier, mode: "insensitive" as const } },
        ],
      },
      select: { id: true, email: true },
    });

    if (!user) return json({ ok: true });

    // Cleanup old tokens for this user (best-effort)
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    });

    // Send email (best-effort; if Resend env not set, it's skipped)
    const resetUrl = `${baseUrl()}/reset-password?token=${encodeURIComponent(token)}`;
    await sendPasswordResetEmail({ to: user.email, resetUrl });

    const expose = process.env.SHOW_RESET_TOKEN === "1" || process.env.NODE_ENV !== "production";
    return json({
      ok: true,
      ...(expose ? { resetToken: token, expiresAt, resetUrl } : {}),
    });
  } catch (e) {
    console.error(e);
    return json({ ok: true });
  }
});

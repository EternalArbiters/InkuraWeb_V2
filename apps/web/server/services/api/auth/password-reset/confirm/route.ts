import "server-only";

import prisma from "@/server/db/prisma";
import bcrypt from "bcryptjs";
import { apiRoute, json, internalError, badRequest } from "@/server/http";
import { enforceRateLimitOrResponse } from "@/server/rate-limit/response";

export const runtime = "nodejs";

export const POST = apiRoute(async (req: Request) => {
  const limited = await enforceRateLimitOrResponse({ req, policyName: "auth.passwordReset.confirm" });
  if (limited) return limited;

  try {
    const body = await req.json().catch(() => ({} as any));
    const token = String(body?.token || "").trim();
    const password = String(body?.password || "");

    if (!token || !password) {
      return badRequest("token and password are required");
    }
    if (password.length < 8) {
      return badRequest("Password must be at least 8 characters");
    }

    const rec = await prisma.passwordResetToken.findUnique({
      where: { token },
      select: { userId: true, expiresAt: true, usedAt: true },
    });

    if (!rec) {
      return badRequest("Invalid token");
    }
    if (rec.usedAt) {
      return badRequest("Token already used");
    }
    if (rec.expiresAt.getTime() < Date.now()) {
      return badRequest("Token expired");
    }

    const hashed = await bcrypt.hash(password, 10);

    await prisma.$transaction([
      prisma.user.update({ where: { id: rec.userId }, data: { password: hashed } }),
      prisma.passwordResetToken.update({ where: { token }, data: { usedAt: new Date() } }),
      prisma.passwordResetToken.deleteMany({ where: { userId: rec.userId, NOT: { token } } }),
    ]);

    return json({ ok: true });
  } catch (e) {
    console.error(e);
    return internalError();
  }
});

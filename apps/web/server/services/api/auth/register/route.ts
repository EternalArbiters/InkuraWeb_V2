import "server-only";

import bcrypt from "bcryptjs";
import prisma from "@/server/db/prisma";
import { enforcedRoleFromEmail } from "@/server/auth/adminEmail";
import { apiRoute, json, internalError, badRequest, conflict } from "@/server/http";
import { enforceRateLimitOrResponse } from "@/server/rate-limit/response";
import { trackAnalyticsEventSafe } from "@/server/analytics/track";

export const runtime = "nodejs";

export const POST = apiRoute(async (req: Request) => {
  const limited = await enforceRateLimitOrResponse({ req, policyName: "auth.register" });
  if (limited) return limited;

  try {
    const body = await req.json();
    const name = (body?.name ?? "").trim();
    const usernameRaw = (body?.username ?? "").trim();
    const username = usernameRaw.toLowerCase();
    const email = (body?.email ?? "").trim().toLowerCase();
    const password = body?.password as string;

    if (!username || !email || !password) {
      return badRequest("username, email, and password are required");
    }

    if (password.length < 8) {
      return badRequest("Password must be at least 8 characters");
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username: { equals: username, mode: "insensitive" as const } }],
      },
      select: { id: true },
    });

    if (existing) {
      return conflict("Email or username already in use");
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name: name || null,
        username,
        email,
        password: hashed,
        role: enforcedRoleFromEmail(email) as any,
        adultConfirmed: false,
        image: "/images/default-avatar.png",
      },
      select: { id: true, email: true, username: true },
    });

    await trackAnalyticsEventSafe({
      req,
      eventType: "SIGNUP_COMPLETE",
      userId: user.id,
      path: "/api/auth/register",
      routeName: "auth.register",
      metadata: { username: user.username },
    });

    return json({ ok: true, user }, { status: 201 });
  } catch (e) {
    console.error(e);
    return internalError();
  }
});

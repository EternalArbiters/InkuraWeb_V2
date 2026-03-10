import "server-only";

import bcrypt from "bcryptjs";
import prisma from "@/server/db/prisma";
import { enforcedRoleFromEmail } from "@/server/auth/adminEmail";
import { apiRoute, json } from "@/server/http";
import { enforceRateLimitOrResponse } from "@/server/rate-limit/response";

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
      return json({ error: "username, email, and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username: { equals: username, mode: "insensitive" as const } }],
      },
      select: { id: true },
    });

    if (existing) {
      return json({ error: "Email or username already in use" }, { status: 409 });
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

    return json({ ok: true, user }, { status: 201 });
  } catch (e) {
    console.error(e);
    return json({ error: "Internal error" }, { status: 500 });
  }
});

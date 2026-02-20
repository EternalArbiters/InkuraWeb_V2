import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { enforcedRoleFromEmail } from "@/server/auth/adminEmail";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = (body?.name ?? "").trim();
    const usernameRaw = (body?.username ?? "").trim();
    const username = usernameRaw.toLowerCase();
    const email = (body?.email ?? "").trim().toLowerCase();
    const password = body?.password as string;

    if (!username || !email || !password) {
      return NextResponse.json({ error: "username, email, and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username: { equals: username, mode: "insensitive" as const } }],
      },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({ error: "Email or username already in use" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name || null,
        username,
        email,
        password: hashed,
        // v14: single admin account is email-gated.
        role: enforcedRoleFromEmail(email) as any,
        // v14: creatorRole removed (publishType is per-work)
        adultConfirmed: false,
        // v14: matureOptIn removed (adultConfirmed is enough)
        image: "/images/default-avatar.png",
      },
      select: { id: true, email: true, username: true },
    });

    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

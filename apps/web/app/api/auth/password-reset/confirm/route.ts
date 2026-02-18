import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const token = String(body?.token || "").trim();
    const password = String(body?.password || "");

    if (!token || !password) {
      return NextResponse.json({ error: "token and password are required" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const rec = await prisma.passwordResetToken.findUnique({
      where: { token },
      select: { userId: true, expiresAt: true, usedAt: true },
    });

    if (!rec) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }
    if (rec.usedAt) {
      return NextResponse.json({ error: "Token already used" }, { status: 400 });
    }
    if (rec.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: "Token expired" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);

    await prisma.$transaction([
      prisma.user.update({ where: { id: rec.userId }, data: { password: hashed } }),
      prisma.passwordResetToken.update({ where: { token }, data: { usedAt: new Date() } }),
      prisma.passwordResetToken.deleteMany({ where: { userId: rec.userId, NOT: { token } } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

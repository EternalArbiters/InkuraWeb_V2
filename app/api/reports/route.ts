import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";

const db = prisma as any;

export const runtime = "nodejs";

function isAdmin(session: any) {
  return String(session?.user?.role || "").toUpperCase() === "ADMIN";
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session as any)?.user?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const message = String(body?.message || "").trim();
  if (!message) return NextResponse.json({ error: "Isi report wajib" }, { status: 400 });

  const report = await db.report.create({
    data: { message, reporterId: userId },
  });

  return NextResponse.json({ ok: true, report });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const reports = await db.report.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { reporter: { select: { id: true, email: true, username: true, name: true } } },
  });

  return NextResponse.json({ reports });
}

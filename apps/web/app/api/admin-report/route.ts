import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/server/auth/requireUser";
import { isAdminEmail } from "@/server/auth/adminEmail";

export const runtime = "nodejs";

function clamp(s: string, max: number) {
  const t = String(s || "").trim();
  return t.length > max ? t.slice(0, max) : t;
}

export async function GET() {
  try {
    const { me } = await requireUser();
    const isAdmin = me.role === "ADMIN" && isAdminEmail((me as any).email);

    const rows = await prisma.adminInboxReport.findMany({
      where: isAdmin ? undefined : { reporterId: me.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        title: true,
        message: true,
        pageUrl: true,
        status: true,
        createdAt: true,
        resolvedAt: true,
        adminNote: true,
        reporter: { select: { id: true, name: true, username: true, email: true, image: true } },
      },
    });

    return NextResponse.json({ reports: rows, isAdmin });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const { me } = await requireUser();
    const body = await req.json().catch(() => ({} as any));

    const title = clamp(body?.title, 80);
    const message = clamp(body?.message, 2000);
    const pageUrl = clamp(body?.pageUrl, 400) || null;

    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
    if (!message) return NextResponse.json({ error: "Message is required" }, { status: 400 });

    const created = await prisma.adminInboxReport.create({
      data: {
        title,
        message,
        pageUrl,
        reporterId: me.id,
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: created.id });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

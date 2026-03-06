import "server-only";

import prisma from "@/server/db/prisma";
import { requireUser } from "@/server/auth/requireUser";
import { isAdminEmail } from "@/server/auth/adminEmail";
import { apiRoute, json } from "@/server/http";

export const runtime = "nodejs";

function clamp(s: string, max: number) {
  const t = String(s || "").trim();
  return t.length > max ? t.slice(0, max) : t;
}

export const GET = apiRoute(async () => {
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
        reporterReadAt: true,
        adminReadAt: true,
        reporter: { select: { id: true, name: true, username: true, email: true, image: true } },
      },
    });

    // Mark as read (best-effort)
    const ids = rows.map((r) => r.id);
    const now = new Date();
    if (ids.length) {
      if (isAdmin) {
        await prisma.adminInboxReport.updateMany({
          where: { id: { in: ids }, adminReadAt: null },
          data: { adminReadAt: now },
        });
      } else {
        await prisma.adminInboxReport.updateMany({
          where: { id: { in: ids }, reporterId: me.id, reporterReadAt: null },
          data: { reporterReadAt: now },
        });
      }
    }

    const reports = rows.map((r: any) => {
      if (isAdmin && !r.adminReadAt) return { ...r, adminReadAt: now };
      if (!isAdmin && !r.reporterReadAt) return { ...r, reporterReadAt: now };
      return r;
    });

    return json({ reports, isAdmin });
  } catch {
    return json({ error: "Unauthorized" }, { status: 401 });
  }
});

export const POST = apiRoute(async (req: Request) => {
  try {
    const { me } = await requireUser();
    const body = await req.json().catch(() => ({} as any));

    const title = clamp(body?.title, 80);
    const message = clamp(body?.message, 2000);
    const pageUrl = clamp(body?.pageUrl, 400) || null;

    if (!title) return json({ error: "Title is required" }, { status: 400 });
    if (!message) return json({ error: "Message is required" }, { status: 400 });

    const created = await prisma.adminInboxReport.create({
      data: {
        title,
        message,
        pageUrl,
        reporterId: me.id,
        reporterReadAt: new Date(),
        // adminReadAt stays null so admin badge increments
      },
      select: { id: true },
    });

    return json({ ok: true, id: created.id });
  } catch {
    return json({ error: "Unauthorized" }, { status: 401 });
  }
});

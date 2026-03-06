import "server-only";

import prisma from "@/server/db/prisma";
import { getSession } from "@/server/auth/session";
import { apiRoute, json } from "@/server/http";

export const PATCH = apiRoute(async (req: Request, { params }: { params: Promise<{ reportId: string }> }) => {
  const { reportId } = await params;
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({} as any));
  const statusRaw = String(body?.status || "RESOLVED").toUpperCase();
  const note = String(body?.note || "").trim().slice(0, 500);
  const hideComment = !!body?.hideComment;

  if (statusRaw !== "RESOLVED" && statusRaw !== "DISMISSED") {
    return json({ error: "status must be RESOLVED or DISMISSED" }, { status: 400 });
  }

  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) return json({ error: "Report not found" }, { status: 404 });

  if (hideComment && report.targetType === "COMMENT") {
    await prisma.comment.updateMany({
      where: { id: report.targetId },
      data: { isHidden: true, hiddenAt: new Date(), hiddenById: session.user.id },
    });
  }

  const updated = await prisma.report.update({
    where: { id: reportId },
    data: {
      status: statusRaw as any,
      resolverId: session.user.id,
      resolvedAt: new Date(),
      note: note || null,
    },
  });

  return json({ ok: true, report: updated });
});

import "server-only";

import prisma from "@/server/db/prisma";
import { getSession } from "@/server/auth/session";
import { apiRoute, json, forbidden, badRequest, notFound } from "@/server/http";

export const PATCH = apiRoute(async (req: Request, { params }: { params: Promise<{ reportId: string }> }) => {
  const { reportId } = await params;
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return forbidden();
  }

  const body = await req.json().catch(() => ({} as any));
  const statusRaw = String(body?.status || "RESOLVED").toUpperCase();
  const note = String(body?.note || "").trim().slice(0, 500);
  const hideComment = !!body?.hideComment;

  if (statusRaw !== "RESOLVED" && statusRaw !== "DISMISSED") {
    return badRequest("status must be RESOLVED or DISMISSED");
  }

  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) return notFound("Report not found");

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

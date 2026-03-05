import prisma from "@/server/db/prisma";
import { getSession } from "@/server/auth/session";
import { apiRoute, json } from "@/server/http";

export const POST = apiRoute(async (req: Request) => {
  const session = await getSession();
  if (!session?.user?.id) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({} as any));
  const targetType = String(body?.targetType || "COMMENT").toUpperCase();
  const targetId = String(body?.targetId || "").trim();
  const reason = String(body?.reason || "").trim();

  if (targetType !== "COMMENT") {
    return json({ error: "Only COMMENT reports supported" }, { status: 400 });
  }
  if (!targetId || !reason) {
    return json({ error: "targetId and reason are required" }, { status: 400 });
  }
  if (reason.length > 500) {
    return json({ error: "Reason too long" }, { status: 400 });
  }

  const comment = await prisma.comment.findUnique({ where: { id: targetId }, select: { id: true } });
  if (!comment) {
    return json({ error: "Comment not found" }, { status: 404 });
  }

  const report = await prisma.report.create({
    data: {
      reporterId: session.user.id,
      targetType: "COMMENT" as any,
      targetId,
      reason,
    },
  });

  return json({ ok: true, report }, { status: 201 });
});

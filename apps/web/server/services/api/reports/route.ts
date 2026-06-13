import "server-only";

import prisma from "@/server/db/prisma";
import { getSession } from "@/server/auth/session";
import { apiRoute, json, unauthorized, badRequest, notFound } from "@/server/http";
import { enforceRateLimitOrResponse } from "@/server/rate-limit/response";
import { trackAnalyticsEventSafe } from "@/server/analytics/track";

export const POST = apiRoute(async (req: Request) => {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();
  const limited = await enforceRateLimitOrResponse({ req, policyName: "report.create", userId: session.user.id });
  if (limited) return limited;

  const body = await req.json().catch(() => ({} as any));
  const targetType = String(body?.targetType || "COMMENT").toUpperCase();
  const targetId = String(body?.targetId || "").trim();
  const reason = String(body?.reason || "").trim();
  if (targetType !== "COMMENT") return badRequest("Only COMMENT reports supported");
  if (!targetId || !reason) return badRequest("targetId and reason are required");
  if (reason.length > 500) return badRequest("Reason too long");

  const comment = await prisma.comment.findUnique({ where: { id: targetId }, select: { id: true, targetId: true } });
  if (!comment) return notFound("Comment not found");
  const report = await prisma.report.create({ data: { reporterId: session.user.id, targetType: "COMMENT" as any, targetId, reason } });
  await trackAnalyticsEventSafe({ req, eventType: "REPORT_CREATE", userId: session.user.id, path: req.url, routeName: "report.create", metadata: { targetType, targetId, reasonLength: reason.length, chapterId: comment.targetId } });
  return json({ ok: true, report }, { status: 201 });
});

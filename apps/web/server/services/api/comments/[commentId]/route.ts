import "server-only";

import { getSession } from "@/server/auth/session";
import { apiRoute, json } from "@/server/http";
import { enforceRateLimitOrResponse } from "@/server/rate-limit/response";
import { deleteComment, updateCommentFromRequest } from "@/server/services/comments/mutations";

export const runtime = "nodejs";

export const PATCH = apiRoute(async (req: Request, { params }: { params: Promise<{ commentId: string }> }) => {
  const session = await getSession();
  if (!session?.user?.id) return json({ error: "Unauthorized" }, { status: 401 });
  const limited = await enforceRateLimitOrResponse({ req, policyName: "comment.edit", userId: session.user.id });
  if (limited) return limited;
  const { commentId } = await params;
  const res = await updateCommentFromRequest(req, commentId);
  return json(res.body, { status: res.status });
});

export const DELETE = apiRoute(async (req: Request, { params }: { params: Promise<{ commentId: string }> }) => {
  const session = await getSession();
  if (!session?.user?.id) return json({ error: "Unauthorized" }, { status: 401 });
  const limited = await enforceRateLimitOrResponse({ req, policyName: "comment.delete", userId: session.user.id });
  if (limited) return limited;
  const { commentId } = await params;
  const res = await deleteComment(commentId);
  return json(res.body, { status: res.status });
});

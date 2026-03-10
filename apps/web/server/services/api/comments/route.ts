import "server-only";

import { getSession } from "@/server/auth/session";
import { apiRoute, json } from "@/server/http";
import { enforceRateLimitOrResponse } from "@/server/rate-limit/response";
import { createCommentFromRequest } from "@/server/services/comments/createComment";
import { fetchCommentsFromRequest } from "@/server/services/comments/fetchComments";

export const runtime = "nodejs";

export const GET = apiRoute(async (req: Request) => {
  const res = await fetchCommentsFromRequest(req);
  return json(res.body, { status: res.status });
});

export const POST = apiRoute(async (req: Request) => {
  const session = await getSession();
  if (!session?.user?.id) return json({ error: "Unauthorized" }, { status: 401 });
  const limited = await enforceRateLimitOrResponse({ req, policyName: "comment.create", userId: session.user.id });
  if (limited) return limited;
  const res = await createCommentFromRequest(req);
  return json(res.body, { status: res.status });
});

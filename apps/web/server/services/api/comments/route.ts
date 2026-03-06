import "server-only";

import { apiRoute, json } from "@/server/http";
import { createCommentFromRequest } from "@/server/services/comments/createComment";
import { fetchCommentsFromRequest } from "@/server/services/comments/fetchComments";

export const runtime = "nodejs";

export const GET = apiRoute(async (req: Request) => {
  const res = await fetchCommentsFromRequest(req);
  return json(res.body, { status: res.status });
});

export const POST = apiRoute(async (req: Request) => {
  const res = await createCommentFromRequest(req);
  return json(res.body, { status: res.status });
});

import "server-only";

import { apiRoute, json } from "@/server/http";
import { toggleCommentLike } from "@/server/services/comments/mutations";

export const runtime = "nodejs";

export const POST = apiRoute(async (_req: Request, { params }: { params: Promise<{ commentId: string }> }) => {
  const { commentId } = await params;
  const res = await toggleCommentLike(commentId);
  return json(res.body, { status: res.status });
});

import "server-only";

import { apiRoute, json } from "@/server/http";
import { setCommentHidden } from "@/server/services/comments/mutations";

export const runtime = "nodejs";

export const POST = apiRoute(async (req: Request, { params }: { params: Promise<{ commentId: string }> }) => {
  const { commentId } = await params;
  const res = await setCommentHidden(req, commentId);
  return json(res.body, { status: res.status });
});

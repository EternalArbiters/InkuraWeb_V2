import "server-only";

import { json } from "@/server/http";
import { toggleCommentLike } from "@/server/services/comments/mutations";


export const POST = async (_req: Request, { params }: { params: Promise<{ commentId: string }> }) => {
  const { commentId } = await params;
  const res = await toggleCommentLike(commentId);
  return json(res.body, { status: res.status });
};

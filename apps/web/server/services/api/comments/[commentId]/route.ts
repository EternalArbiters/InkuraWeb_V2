import "server-only";

import { json } from "@/server/http";
import { deleteComment, updateCommentFromRequest } from "@/server/services/comments/mutations";


export const PATCH = async (req: Request, { params }: { params: Promise<{ commentId: string }> }) => {
  const { commentId } = await params;
  const res = await updateCommentFromRequest(req, commentId);
  return json(res.body, { status: res.status });
};
export const DELETE = async (_req: Request, { params }: { params: Promise<{ commentId: string }> }) => {
  const { commentId } = await params;
  const res = await deleteComment(commentId);
  return json(res.body, { status: res.status });
};

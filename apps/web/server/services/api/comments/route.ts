import "server-only";

import { json } from "@/server/http";
import { createCommentFromRequest } from "@/server/services/comments/createComment";
import { fetchCommentsFromRequest } from "@/server/services/comments/fetchComments";


export const GET = async (req: Request) => {
  const res = await fetchCommentsFromRequest(req);
  return json(res.body, { status: res.status });
};
export const POST = async (req: Request) => {
  const res = await createCommentFromRequest(req);
  return json(res.body, { status: res.status });
};

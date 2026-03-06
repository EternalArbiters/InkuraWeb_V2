import { apiRoute } from "@/server/http";
import { PATCH as PATCH_HANDLER, DELETE as DELETE_HANDLER } from "@/server/services/api/comments/[commentId]/route";

export const runtime = "nodejs";

export const PATCH = apiRoute(PATCH_HANDLER);
export const DELETE = apiRoute(DELETE_HANDLER);

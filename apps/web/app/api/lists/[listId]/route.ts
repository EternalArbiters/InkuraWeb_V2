import { apiRoute } from "@/server/http";
import { GET as GET_HANDLER, PATCH as PATCH_HANDLER, DELETE as DELETE_HANDLER } from "@/server/services/api/lists/[listId]/route";

export const runtime = "nodejs";

export const GET = apiRoute(GET_HANDLER);
export const PATCH = apiRoute(PATCH_HANDLER);
export const DELETE = apiRoute(DELETE_HANDLER);

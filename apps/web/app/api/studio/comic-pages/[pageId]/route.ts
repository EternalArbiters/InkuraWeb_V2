import { apiRoute } from "@/server/http";
import { DELETE as DELETE_HANDLER, PATCH as PATCH_HANDLER } from "@/server/services/api/studio/comic-pages/[pageId]/route";

export const runtime = "nodejs";

export const DELETE = apiRoute(DELETE_HANDLER);
export const PATCH = apiRoute(PATCH_HANDLER);

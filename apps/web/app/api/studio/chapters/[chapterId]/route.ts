import { apiRoute } from "@/server/http";
import { GET as GET_HANDLER, PATCH as PATCH_HANDLER } from "@/server/services/api/studio/chapters/[chapterId]/route";

export const runtime = "nodejs";

export const GET = apiRoute(GET_HANDLER);
export const PATCH = apiRoute(PATCH_HANDLER);

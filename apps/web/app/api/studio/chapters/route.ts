import { apiRoute } from "@/server/http";
import { POST as POST_HANDLER } from "@/server/services/api/studio/chapters/route";

export const runtime = "nodejs";

export const POST = apiRoute(POST_HANDLER);

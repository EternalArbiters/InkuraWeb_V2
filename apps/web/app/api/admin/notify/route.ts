import { apiRoute } from "@/server/http";
import { POST as POST_HANDLER } from "@/server/services/api/admin/notify/route";

export const runtime = "nodejs";

export const POST = apiRoute(POST_HANDLER);

import { apiRoute } from "@/server/http";
import { POST as POST_HANDLER } from "@/server/services/api/admin/taxonomy/deviant-love-tags/reorder/route";

export const runtime = "nodejs";

export const POST = apiRoute(POST_HANDLER);

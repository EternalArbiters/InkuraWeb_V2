import { apiRoute } from "@/server/http";
import { GET as GET_HANDLER, POST as POST_HANDLER } from "@/server/services/api/admin/taxonomy/tags/route";

export const runtime = "nodejs";

export const GET = apiRoute(GET_HANDLER);
export const POST = apiRoute(POST_HANDLER);

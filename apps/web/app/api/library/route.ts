import { apiRoute } from "@/server/http";
import { GET as GET_HANDLER } from "@/server/services/api/library/route";

export const runtime = "nodejs";

export const GET = apiRoute(GET_HANDLER);

import { apiRoute } from "@/server/http";
import { GET as GET_HANDLER } from "@/server/services/api/tags/route";

export const GET = apiRoute(GET_HANDLER);

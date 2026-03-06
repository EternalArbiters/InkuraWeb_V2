import { apiRoute } from "@/server/http";
import { GET as GET_HANDLER } from "@/server/services/api/warnings/route";

export const GET = apiRoute(GET_HANDLER);

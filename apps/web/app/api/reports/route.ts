import { apiRoute } from "@/server/http";
import { POST as POST_HANDLER } from "@/server/services/api/reports/route";

export const POST = apiRoute(POST_HANDLER);

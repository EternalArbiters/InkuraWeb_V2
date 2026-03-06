import { apiRoute } from "@/server/http";
import { POST as POST_HANDLER } from "@/server/services/api/works/[workId]/rate/route";

export const POST = apiRoute(POST_HANDLER);

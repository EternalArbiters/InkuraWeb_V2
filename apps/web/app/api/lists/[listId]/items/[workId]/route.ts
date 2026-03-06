import { apiRoute } from "@/server/http";
import { DELETE as DELETE_HANDLER } from "@/server/services/api/lists/[listId]/items/[workId]/route";

export const runtime = "nodejs";

export const DELETE = apiRoute(DELETE_HANDLER);

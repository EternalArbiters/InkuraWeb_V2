import { apiRoute } from "@/server/http";
import { PATCH as PATCH_HANDLER } from "@/server/services/api/admin/reports/[reportId]/route";

export const PATCH = apiRoute(PATCH_HANDLER);

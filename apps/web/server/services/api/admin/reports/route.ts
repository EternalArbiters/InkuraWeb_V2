import "server-only";

import { apiRoute, json } from "@/server/http";
import { listOpenAdminReports } from "@/server/services/admin/reports";

export const runtime = "nodejs";

export const GET = apiRoute(async () => {
  const data = await listOpenAdminReports();
  return json({ ok: true, ...data });
});

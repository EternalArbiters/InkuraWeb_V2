import "server-only";

import { requireAdminSession } from "@/server/http/auth";
import { apiRoute, json } from "@/server/http";
import { rebuildCommunitySnapshots } from "@/server/services/admin/community";

export const runtime = "nodejs";

export const POST = apiRoute(async (_req: Request) => {
  await requireAdminSession();
  const result = await rebuildCommunitySnapshots();
  return json(result);
});

import "server-only";

import { requireAdminSession } from "@/server/http/auth";
import { apiRoute, json } from "@/server/http";
import { searchAdminWorks } from "@/server/services/admin/works";

export const runtime = "nodejs";

export const GET = apiRoute(async (req: Request) => {
  await requireAdminSession();
  const url = new URL(req.url);
  const query = url.searchParams.get("q") || undefined;
  const take = Math.min(100, Number(url.searchParams.get("take") || 60));
  const works = await searchAdminWorks({ query, take });
  return json({ ok: true, works });
});

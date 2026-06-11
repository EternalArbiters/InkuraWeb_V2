import "server-only";

import { requireAdminSession } from "@/server/http/auth";
import { apiRoute, json } from "@/server/http";
import { searchAdminUsers } from "@/server/services/admin/works";

export const runtime = "nodejs";

export const GET = apiRoute(async (req: Request) => {
  await requireAdminSession();
  const url = new URL(req.url);
  const query = url.searchParams.get("q") || "";
  const users = await searchAdminUsers({ query, take: 20 });
  return json({ ok: true, users });
});

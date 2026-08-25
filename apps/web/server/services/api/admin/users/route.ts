import "server-only";

import { adminGuard } from "@/server/services/api/admin/taxonomy/_shared";
import { apiRoute, badRequest, conflict, getClientMeta, json, readJsonObject } from "@/server/http";
import { searchAdminUsers } from "@/server/services/admin/works";
import { createAdminUser } from "@/server/services/admin/users";

export const runtime = "nodejs";

export const GET = apiRoute(async (req: Request) => {
  await adminGuard();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const users = await searchAdminUsers({ query: q, take: 60 });
  return json({ users });
});

export const POST = apiRoute(async (req: Request) => {
  const { adminId } = await adminGuard();
  const body = await readJsonObject(req);
  const { ip, userAgent } = getClientMeta(req);

  try {
    const user = await createAdminUser({
      adminId,
      email: String(body.email || ""),
      username: String(body.username || ""),
      password: String(body.password || ""),
      name: body.name ? String(body.name) : null,
      role: body.role,
      ip,
      userAgent,
    });
    return json({ ok: true, user }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create user";
    if (message === "Email or username already in use") return conflict(message);
    return badRequest(message);
  }
});

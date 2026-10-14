import "server-only";

import { adminGuard } from "@/server/services/api/admin/taxonomy/_shared";
import { apiRoute, badRequest, getClientMeta, json, notFound, readJsonObject } from "@/server/http";
import { adminResetUserPassword } from "@/server/services/admin/users";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ userId: string }> };

export const PATCH = apiRoute(async (req: Request, ctx: Ctx) => {
  const { adminId } = await adminGuard();
  const { userId } = await ctx.params;
  const body = await readJsonObject(req);
  const { ip, userAgent } = getClientMeta(req);

  try {
    const user = await adminResetUserPassword({
      adminId,
      userId,
      password: String(body.password || ""),
      ip,
      userAgent,
    });
    return json({ ok: true, user });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to reset password";
    if (message === "User not found") return notFound(message);
    return badRequest(message);
  }
});

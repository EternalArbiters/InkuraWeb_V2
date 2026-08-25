import "server-only";

import { requireAdminSession } from "@/server/http/auth";
import { apiRoute, badRequest, json, notFound, readJsonObject } from "@/server/http";
import { patchAdminWorkIsAdminCollection, patchAdminWorkPublishType } from "@/server/services/admin/works";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ workId: string }> };

export const PATCH = apiRoute(async (req: Request, ctx: Ctx) => {
  await requireAdminSession();
  const { workId } = await ctx.params;
  const body = await readJsonObject(req);

  try {
    if (typeof body.isAdminCollection === "boolean") {
      const result = await patchAdminWorkIsAdminCollection(workId, body.isAdminCollection);
      return json(result);
    }

    const result = await patchAdminWorkPublishType(workId, String(body.publishType || ""));
    return json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update work";
    if (message === "Invalid publishType") return badRequest(message);
    if (message === "Work not found") return notFound(message);
    throw err;
  }
});

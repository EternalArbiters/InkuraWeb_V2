import "server-only";

import { requireAdminSession } from "@/server/http/auth";
import { apiRoute, badRequest, json, readJsonObject } from "@/server/http";
import { clearLeaderboardCategory } from "@/server/services/admin/community";

export const runtime = "nodejs";

export const POST = apiRoute(async (req: Request) => {
  await requireAdminSession();
  const body = await readJsonObject(req);
  const { category } = body;
  if (!category || typeof category !== "string") return badRequest("category is required");
  try {
    const result = await clearLeaderboardCategory(category);
    return json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to clear snapshot";
    if (message === "Invalid category") return badRequest(message);
    throw err;
  }
});

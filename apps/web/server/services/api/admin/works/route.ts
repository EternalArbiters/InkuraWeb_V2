import "server-only";

import { requireAdminSession } from "@/server/http/auth";
import { apiRoute, json, badRequest } from "@/server/http";
import { readJsonObject } from "@/server/http/request";
import { searchAdminWorks, createAdminWorkOnBehalf } from "@/server/services/admin/works";

export const runtime = "nodejs";

export const GET = apiRoute(async (req: Request) => {
  await requireAdminSession();
  const url = new URL(req.url);
  const query = url.searchParams.get("q") || undefined;
  const take = Math.min(100, Number(url.searchParams.get("take") || 60));
  const works = await searchAdminWorks({ query, take });
  return json({ ok: true, works });
});

export const POST = apiRoute(async (req: Request) => {
  const session = await requireAdminSession();
  const body = await readJsonObject(req);
  const { title, type, publishType, language, creatorUserId, description } = body;

  if (!title || typeof title !== "string" || !title.trim()) return badRequest("title is required");
  if (!["COMIC", "NOVEL"].includes(type)) return badRequest("type must be COMIC or NOVEL");
  if (!["ORIGINAL", "TRANSLATION", "REUPLOAD"].includes(publishType)) return badRequest("invalid publishType");
  if (!creatorUserId || typeof creatorUserId !== "string") return badRequest("creatorUserId is required");

  try {
    const result = await createAdminWorkOnBehalf({
      title,
      type: type as "COMIC" | "NOVEL",
      publishType: publishType as "ORIGINAL" | "TRANSLATION" | "REUPLOAD",
      language: typeof language === "string" ? language : "unknown",
      creatorUserId,
      adminUserId: session.userId,
      description: typeof description === "string" ? description : undefined,
    });
    return json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create work";
    if (message === "Creator user not found") return badRequest(message);
    throw err;
  }
});

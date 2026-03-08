import "server-only";

import { apiRoute, json, publicCacheControl } from "@/server/http";
import { getOptionalIntParam, getOptionalStringParam } from "@/server/http/queryParams";
import { listActiveDeviantLoveTags } from "@/server/services/taxonomy/publicTaxonomy";

export const runtime = "nodejs";

export const GET = apiRoute(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const q = getOptionalStringParam(searchParams, "q") || "";
  const take = getOptionalIntParam(searchParams, "take", { min: 1, max: 200 }) || 200;

  const deviantLoveTags = await listActiveDeviantLoveTags({ q, take });

  return json(
    { deviantLoveTags },
    {
      headers: {
        "Cache-Control": publicCacheControl({ sMaxAge: 300, staleWhileRevalidate: 86_400 }),
      },
    }
  );
});

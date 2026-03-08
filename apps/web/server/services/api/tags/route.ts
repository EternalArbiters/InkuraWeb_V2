import "server-only";

import { apiRoute, json, publicCacheControl } from "@/server/http";
import { getOptionalIntParam, getOptionalStringParam } from "@/server/http/queryParams";
import { listActiveTags } from "@/server/services/taxonomy/publicTaxonomy";

export const GET = apiRoute(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const q = getOptionalStringParam(searchParams, "q") || "";
  const take = getOptionalIntParam(searchParams, "take", { min: 1, max: 25 }) || 20;

  const tags = await listActiveTags({ q, take });

  return json(
    { tags },
    {
      headers: {
        "Cache-Control": publicCacheControl({ sMaxAge: 300, staleWhileRevalidate: 86_400 }),
      },
    }
  );
});

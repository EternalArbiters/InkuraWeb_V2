import "server-only";

import { apiRoute, json, publicCacheControl } from "@/server/http";
import { getOptionalIntParam, getOptionalStringParam } from "@/server/http/queryParams";
import { listActiveGenres } from "@/server/services/taxonomy/publicTaxonomy";

export const runtime = "nodejs";

export const GET = apiRoute(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const q = getOptionalStringParam(searchParams, "q") || "";
  const take = getOptionalIntParam(searchParams, "take", { min: 1, max: 200 }) || 200;

  const genres = await listActiveGenres({ q, take });

  return json(
    { genres },
    {
      headers: {
        "Cache-Control": publicCacheControl({ sMaxAge: 300, staleWhileRevalidate: 86_400 }),
      },
    }
  );
});

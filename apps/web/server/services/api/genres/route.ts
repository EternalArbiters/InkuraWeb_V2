import "server-only";

import { apiRoute, json, publicCacheControl } from "@/server/http";
import { listActiveGenres } from "@/server/services/taxonomy/publicTaxonomy";

export const runtime = "nodejs";

export const GET = apiRoute(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const take = Math.min(200, Math.max(1, parseInt(searchParams.get("take") || "200", 10) || 200));

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

import "server-only";

import { apiRoute, json, publicCacheControl } from "@/server/http";
import { listActiveDeviantLoveTags } from "@/server/services/taxonomy/publicTaxonomy";

export const runtime = "nodejs";

export const GET = apiRoute(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const take = Math.min(200, Math.max(1, parseInt(searchParams.get("take") || "200", 10) || 200));

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

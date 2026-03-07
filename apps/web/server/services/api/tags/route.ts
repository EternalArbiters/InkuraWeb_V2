import "server-only";

import { apiRoute, json, publicCacheControl } from "@/server/http";
import { listActiveTags } from "@/server/services/taxonomy/publicTaxonomy";

export const GET = apiRoute(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const take = Math.min(25, Math.max(1, parseInt(searchParams.get("take") || "20", 10) || 20));

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

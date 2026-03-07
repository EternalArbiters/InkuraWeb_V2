import "server-only";

import { apiRoute, json, publicCacheControl } from "@/server/http";
import { listActiveWarningTags } from "@/server/services/taxonomy/publicTaxonomy";

export const GET = apiRoute(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const take = Math.min(100, Math.max(1, parseInt(searchParams.get("take") || "100", 10) || 100));

  const warningTags = await listActiveWarningTags({ q, take });

  return json(
    { warningTags },
    {
      headers: {
        "Cache-Control": publicCacheControl({ sMaxAge: 300, staleWhileRevalidate: 86_400 }),
      },
    }
  );
});

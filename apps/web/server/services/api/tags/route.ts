import "server-only";

import { getActiveTagsBase } from "@/server/cache/taxonomy";
import { json } from "@/server/http";

export const dynamic = "force-dynamic";

export const GET = async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const take = Math.min(25, Math.max(1, parseInt(searchParams.get("take") || "20", 10) || 20));

  const base = await getActiveTagsBase();
  const qLower = q.toLowerCase();
  const filtered = q
    ? base.filter((t) => t.name.toLowerCase().includes(qLower) || t.slug.toLowerCase().includes(qLower))
    : base;

  const tags = filtered.slice(0, take).map((t) => ({ id: t.id, name: t.name, slug: t.slug }));

  return json(
    { tags },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
};

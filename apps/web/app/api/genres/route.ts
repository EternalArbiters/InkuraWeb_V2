import { getActiveGenresBase } from "@/server/cache/taxonomy";
import { apiRoute, json } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = apiRoute(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const take = Math.min(200, Math.max(1, parseInt(searchParams.get("take") || "200", 10) || 200));

  const base = await getActiveGenresBase();
  const qLower = q.toLowerCase();
  const filtered = q
    ? base.filter((g) => g.name.toLowerCase().includes(qLower) || g.slug.toLowerCase().includes(qLower))
    : base;

  const genres = filtered.slice(0, take).map((g) => ({
    id: g.id,
    name: g.name,
    slug: g.slug,
    _count: { works: g.worksCount },
  }));

  return json(
    { genres },
    {
      headers: {
        // Prevent CDN/browser caching. We handle caching via `unstable_cache` + `revalidateTag("taxonomy")`.
        "Cache-Control": "no-store",
      },
    }
  );
});

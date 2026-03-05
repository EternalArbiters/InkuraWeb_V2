import "server-only";

import { deviantLoveTagSlugs } from "@/lib/deviantLoveCatalog";

/**
 * Older DBs may have Deviant Love categories stored as Genre slugs.
 * Treat them as Deviant Love for gating.
 */
export function legacyDeviantGenreSlugs(): string[] {
  const base = new Set<string>([...deviantLoveTagSlugs(), "lgbtq", "bara-ml", "alpha-beta-omega"]);
  return Array.from(base);
}

export function legacyDeviantGenreSlugSet(): Set<string> {
  return new Set(legacyDeviantGenreSlugs());
}

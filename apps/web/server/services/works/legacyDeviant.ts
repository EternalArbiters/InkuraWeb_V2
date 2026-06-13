import "server-only";

import { deviantLoveTagSlugs } from "@/lib/deviantLoveCatalog";

// Older DBs may have Deviant Love categories stored as Genre slugs.
// Treat them as Deviant Love for gating.
// Computed once at module load — value is static relative to the catalog.
export const LEGACY_DEVIANT_GENRE_SLUGS: string[] = Array.from(
  new Set([...deviantLoveTagSlugs(), "lgbtq", "bara-ml", "alpha-beta-omega"]),
);

export const LEGACY_DEVIANT_GENRE_SLUG_SET: Set<string> = new Set(LEGACY_DEVIANT_GENRE_SLUGS);

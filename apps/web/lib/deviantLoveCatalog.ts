// Deviant Love catalog (locked by default; separate from NSFW WarningTag and regular Genre).

import { slugify } from "@/lib/slugify";

export const DEVIANT_LOVE_CATALOG: string[] = [
  "Yuri (GL)",
  "Yaoi (BL)",
  "Shoujo Ai (GL Bait)",
  "Shounen Ai (BL Bait)",
  "Omegaverse",
  "Futanari",
  "Incest",
];

export function deviantLoveTagSlugs() {
  return uniqueDeviantLoveCatalog().map((n) => slugify(String(n || "").trim())).filter(Boolean);
}

export function uniqueDeviantLoveCatalog() {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const name of DEVIANT_LOVE_CATALOG) {
    const n = String(name || "").trim();
    if (!n) continue;
    const key = n.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(n);
  }
  return out;
}

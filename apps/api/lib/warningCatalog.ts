// NSFW / 18+ tags (moved from Genre catalog).
// These are treated as "warningTags" so they can be locked behind age-confirmation.
export const NSFW_TAG_CATALOG: string[] = [
  "NSFW",
  "Adult",
  "Mature",
  "Ecchi",
  "Smut",
  "Nudity",
  "BDSM",
  "Gore",
  "Yuri (GL)",
  "Yaoi (BL)",
  "Bara (ML)",
  "LGBTQ+",
  "Omegaverse",
  "Alpha/Beta/Omega",
  "Alcohol",
];

// Content warning catalog (work-level and/or chapter-level).
export const WARNING_CATALOG: string[] = [
  // NSFW tags first
  ...NSFW_TAG_CATALOG,

  // Sexual content
  "Sexual Content",
  "Nudity",
  "Explicit Sex",
  "Suggestive Themes",
  "Adult Themes",

  // Violence
  "Violence",
  "Graphic Violence",
  "Gore",
  "Torture",
  "Body Horror",
  "War",

  // Abuse / coercion
  "Abuse",
  "Domestic Abuse",
  "Child Abuse",
  "Bullying",
  "Gaslighting",
  "Stalking",
  "Blackmail",
  "Kidnapping",

  // Consent / taboo
  "Non-Consent",
  "Dubious Consent",
  "Incest",
  "Age Gap",
  "Underage",
  "Cheating/Infidelity",

  // Mental health
  "Self-Harm",
  "Suicide",
  "Depression",
  "Panic/Anxiety",
  "Eating Disorder",

  // Substance
  "Drug Use",
  "Alcohol Use",
  "Smoking",

  // Sensitive topics
  "Hate Speech",
  "Discrimination",
  "Racism",
  "Religious Trauma",
  "Politics",

  // Other
  "Profanity",
  "Medical",
  "Pregnancy",
  "Miscarriage",
  "Death",
  "Animal Death",
];

// Keep slugify consistent with seed + API routes.
export function slugifyTag(input: string) {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function nsfwTagSlugs() {
  return NSFW_TAG_CATALOG.map((n) => slugifyTag(n));
}

export function uniqueWarningCatalog() {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const name of WARNING_CATALOG) {
    const n = String(name || "").trim();
    if (!n) continue;
    const key = n.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(n);
  }
  return out;
}

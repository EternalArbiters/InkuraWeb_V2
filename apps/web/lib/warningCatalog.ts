// Content warning / NSFW catalog (work-level and/or chapter-level).
//
// NOTE (v13): "NSFW"/18+ tags are treated as WarningTag (not Genre) so they can be age-locked.
// The UI uses /api/warnings to fetch these tags; /api/genres should exclude them.

export function slugifyTag(input: string) {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

// Curated NSFW / sensitive tag catalog.
// This list is intentionally broader than "sexual" — it includes violence/gore etc.
// so creators can label sensitive content and readers can filter/opt-in.
export const NSFW_TAG_CATALOG: string[] = [
  // Meta
  "NSFW",
  "Mature",
  "Adult",
  "18+",

  // Sexual
  "Sexual Content",
  "Nudity",
  "Explicit Sex",
  "Suggestive Themes",
  "Adult Themes",
  "Ecchi",
  "Smut",

  // Violence / gore
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

// Slugs of tags that should be excluded from the "Genre" picker/list.
export function nsfwTagSlugs() {
  return Array.from(new Set(NSFW_TAG_CATALOG.map(slugifyTag).filter(Boolean)));
}

export const WARNING_CATALOG: string[] = [
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

export function uniqueWarningCatalog() {
  // Backwards compatible: WARNING_CATALOG is kept for callers that still import it,
  // but the canonical seed list is NSFW_TAG_CATALOG.
  const source = NSFW_TAG_CATALOG.length ? NSFW_TAG_CATALOG : WARNING_CATALOG;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const name of source) {
    const n = String(name || "").trim();
    if (!n) continue;
    const key = n.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(n);
  }
  return out;
}

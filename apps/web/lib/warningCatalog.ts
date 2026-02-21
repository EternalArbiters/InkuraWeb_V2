// Content warning catalog (work-level and/or chapter-level).
//
// NOTE:
// - WARNING_CATALOG: broad content warnings
// - NSFW_TAG_CATALOG: a small set of "NSFW gate" tags that should be age-locked
//   and kept OUT of regular Genre lists.

import { slugify } from "@/lib/slugify";

// "NSFW gate" tags (used for age-locking and filtering).
// These tags are considered 18+ / sensitive and are locked behind adultConfirmed.
export const NSFW_TAG_CATALOG: string[] = [
  "NSFW",
  "Mature",
  "Adult",
  "Smut",
  "Ecchi",
  "Nudity",
  // Requested: move from Genre -> NSFW taxonomy
  "Abuse",
  "Alcohol",
  "Domestic Violence",
  "Drug Use",
  "Fetish",
  "Gore",
  "Graphic Violence",
  "Harassment",
  "Non-Consensual",
  "SM/BDSM/SUB-DOM",
  "Self-Harm",
];

export function slugifyTag(name: string) {
  return slugify(String(name || "").trim());
}

export function nsfwTagSlugs() {
  return NSFW_TAG_CATALOG.map((x) => slugifyTag(x)).filter(Boolean);
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
  "Domestic Violence",
  "Child Abuse",
  "Bullying",
  "Gaslighting",
  "Stalking",
  "Blackmail",
  "Kidnapping",

  // Consent / taboo
  "Non-Consensual",
  "Dubious Consent",
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
  "Alcohol",
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
  const seen = new Set<string>();
  const out: string[] = [];

  // Combine both warning tags + NSFW-gate tags so the UI can render a single pick-list.
  for (const name of [...NSFW_TAG_CATALOG, ...WARNING_CATALOG]) {
    const n = String(name || "").trim();
    if (!n) continue;
    const key = n.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(n);
  }

  return out;
}

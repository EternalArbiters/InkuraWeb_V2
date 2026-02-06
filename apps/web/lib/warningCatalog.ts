// Content warning catalog (work-level and/or chapter-level).

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

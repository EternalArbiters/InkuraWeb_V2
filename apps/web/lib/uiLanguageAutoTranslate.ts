import type { InkuraLanguageCode } from "@/lib/inkuraLanguage";
import {
  canonicalizeUILanguageText,
  lookupUILanguageText,
  type UILanguageCatalog,
} from "@/lib/uiLanguageCatalog";

export type UILanguageCatalogMap = Record<InkuraLanguageCode, UILanguageCatalog>;

export type AutoTranslateResolveMode = "full" | "incremental";

export type PartialCandidate = {
  candidate: string;
  source: string;
};

export function buildAutoTranslateSourceMap(catalog: UILanguageCatalog) {
  const map = new Map<string, string>();

  for (const section of catalog.sections) {
    for (const entry of section.entries) {
      const key = canonicalizeUILanguageText(entry.source);
      if (!key || map.has(key)) continue;
      map.set(key, entry.source);
    }
  }

  return map;
}

export function buildAutoTranslateReverseLookup(catalogs: UILanguageCatalogMap) {
  const lookup = new Map<string, string>();
  const duplicates = new Set<string>();

  for (const catalog of Object.values(catalogs)) {
    for (const section of catalog.sections) {
      for (const entry of section.entries) {
        const targetKey = canonicalizeUILanguageText(entry.target);
        const source = entry.source.trim();
        if (!targetKey || !source || targetKey === canonicalizeUILanguageText(source)) continue;

        if (lookup.has(targetKey) && lookup.get(targetKey) !== source) {
          duplicates.add(targetKey);
          continue;
        }

        lookup.set(targetKey, source);
      }
    }
  }

  for (const duplicate of duplicates) {
    lookup.delete(duplicate);
  }

  return lookup;
}

function phraseVariants(text: string) {
  const variants = new Set<string>();
  const base = text.trim();
  if (!base) return variants;

  variants.add(base);
  variants.add(base.replace(/'/g, "’"));
  variants.add(base.replace(/\.\.\./g, "…"));
  variants.add(base.replace(/'/g, "’").replace(/\.\.\./g, "…"));

  return variants;
}

export function buildAutoTranslatePartialCandidates(catalogs: UILanguageCatalogMap, sourceCatalog: UILanguageCatalog) {
  const phraseToSource = new Map<string, string>();
  const duplicates = new Set<string>();

  const register = (candidate: string, source: string) => {
    const trimmedCandidate = candidate.trim();
    const trimmedSource = source.trim();
    if (!trimmedCandidate || !trimmedSource) return;
    if (trimmedCandidate.length < 3) return;
    if (!/[A-Za-z]/.test(trimmedCandidate)) return;

    for (const variant of phraseVariants(trimmedCandidate)) {
      if (phraseToSource.has(variant) && phraseToSource.get(variant) !== trimmedSource) {
        duplicates.add(variant);
        continue;
      }
      phraseToSource.set(variant, trimmedSource);
    }
  };

  for (const section of sourceCatalog.sections) {
    for (const entry of section.entries) {
      register(entry.source, entry.source);
    }
  }

  for (const catalog of Object.values(catalogs)) {
    for (const section of catalog.sections) {
      for (const entry of section.entries) {
        if (entry.target.trim() !== entry.source.trim()) {
          register(entry.target, entry.source);
        }
      }
    }
  }

  for (const duplicate of duplicates) {
    phraseToSource.delete(duplicate);
  }

  return Array.from(phraseToSource.entries())
    .map(([candidate, source]) => ({ candidate, source }))
    .sort((left, right) => right.candidate.length - left.candidate.length);
}

export function resolveAutoTranslateSourceText(
  rawValue: string,
  {
    mode,
    sourceMap,
    reverseLookup,
  }: {
    mode: AutoTranslateResolveMode;
    sourceMap: Map<string, string>;
    reverseLookup: Map<string, string>;
  }
) {
  const canonical = canonicalizeUILanguageText(rawValue);
  if (!canonical) return null;

  const sourceText = sourceMap.get(canonical);
  if (sourceText) return sourceText;

  if (mode === "full") {
    return reverseLookup.get(canonical) ?? null;
  }

  return null;
}

export function replaceAutoTranslateKnownPhrases(
  rawValue: string,
  activeCatalog: UILanguageCatalog,
  sourceCatalog: UILanguageCatalog,
  partialCandidates: PartialCandidate[]
) {
  let nextValue = rawValue;

  for (const entry of partialCandidates) {
    if (!nextValue.includes(entry.candidate)) continue;
    const translated = lookupUILanguageText(activeCatalog, entry.source, { fallbackCatalog: sourceCatalog });
    if (!translated || translated === entry.candidate) continue;
    nextValue = nextValue.split(entry.candidate).join(translated);
  }

  return nextValue;
}

export function shouldAllowAutoTranslatePartialReplacement(options: { hasExplicitOptIn: boolean }) {
  return options.hasExplicitOptIn;
}

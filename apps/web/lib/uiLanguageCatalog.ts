import { DEFAULT_GUEST_INKURA_LANGUAGE, normalizeInkuraLanguage, type InkuraLanguageCode } from "@/lib/inkuraLanguage";

const SECTION_DIVIDER_RE = /^={3,}$/;

export type UILanguageEntry = {
  source: string;
  target: string;
  line: number;
};

export type UILanguageSection = {
  name: string;
  entries: UILanguageEntry[];
};

export type UILanguageCatalog = {
  language: InkuraLanguageCode;
  sections: UILanguageSection[];
  sectionLookup: Record<string, Record<string, string>>;
  globalLookup: Record<string, string>;
};

export type UILanguageLookupOptions = {
  section?: string | null;
  fallbackCatalog?: UILanguageCatalog | null;
};

function normalizeLine(line: string) {
  return line.replace(/^\uFEFF/, "").trim();
}

function isSectionDivider(line: string) {
  return SECTION_DIVIDER_RE.test(normalizeLine(line));
}

function parseRawSections(content: string): Array<{ name: string; entries: Array<{ raw: string; line: number }> }> {
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  const sections: Array<{ name: string; entries: Array<{ raw: string; line: number }> }> = [];
  let currentSectionName = "Ungrouped";

  const ensureSection = (name: string) => {
    const existing = sections.find((section) => section.name === name);
    if (existing) return existing;
    const created = { name, entries: [] as Array<{ raw: string; line: number }> };
    sections.push(created);
    return created;
  };

  ensureSection(currentSectionName);

  for (let index = 0; index < lines.length; index += 1) {
    const current = normalizeLine(lines[index] ?? "");
    const next = normalizeLine(lines[index + 1] ?? "");
    const third = normalizeLine(lines[index + 2] ?? "");

    if (isSectionDivider(current) && next && isSectionDivider(third)) {
      currentSectionName = next;
      ensureSection(currentSectionName);
      index += 2;
      continue;
    }

    if (!current || current.startsWith("#")) continue;

    ensureSection(currentSectionName).entries.push({ raw: current, line: index + 1 });
  }

  return sections.filter((section) => section.entries.length > 0 || section.name !== "Ungrouped");
}

function parseEntryLine(language: InkuraLanguageCode, raw: string, line: number): UILanguageEntry {
  if (language === "EN") {
    return { source: raw, target: raw, line };
  }

  const separatorIndex = raw.indexOf("=");
  if (separatorIndex < 0) {
    return { source: raw, target: raw, line };
  }

  const source = raw.slice(0, separatorIndex).trim();
  const translated = raw.slice(separatorIndex + 1).trim();
  if (!source) {
    throw new Error(`[UIlanguage:${language}] Missing source text on line ${line}.`);
  }

  return {
    source,
    target: translated || source,
    line,
  };
}

function buildSectionLookup(sections: UILanguageSection[], language: InkuraLanguageCode) {
  const sectionLookup: Record<string, Record<string, string>> = {};
  const globalCandidates = new Map<string, Set<string>>();

  for (const section of sections) {
    const perSection = (sectionLookup[section.name] ||= {});
    for (const entry of section.entries) {
      const existing = perSection[entry.source];
      if (existing && existing !== entry.target) {
        throw new Error(
          `[UIlanguage:${language}] Duplicate source text with different translations in section "${section.name}" on line ${entry.line}: ${entry.source}`
        );
      }
      perSection[entry.source] = entry.target;

      const values = globalCandidates.get(entry.source) ?? new Set<string>();
      values.add(entry.target);
      globalCandidates.set(entry.source, values);
    }
  }

  const globalLookup: Record<string, string> = {};
  for (const [source, values] of globalCandidates.entries()) {
    if (values.size === 1) {
      globalLookup[source] = Array.from(values)[0] as string;
    }
  }

  return { sectionLookup, globalLookup };
}

function validateTranslatedCatalog(catalog: UILanguageCatalog, sourceCatalog: UILanguageCatalog) {
  const sourceSections = sourceCatalog.sectionLookup;
  const sourceGlobal = sourceCatalog.globalLookup;

  for (const section of catalog.sections) {
    const matchingSourceSection = sourceSections[section.name] ?? null;
    for (const entry of section.entries) {
      const existsInSameSection = !!matchingSourceSection?.[entry.source];
      const existsAnywhere = !!sourceGlobal[entry.source];
      if (!existsInSameSection && !existsAnywhere) {
        throw new Error(
          `[UIlanguage:${catalog.language}] Source text not found in EN on line ${entry.line}: ${entry.source}`
        );
      }
    }
  }
}

export function parseUILanguageCatalog(
  languageInput: unknown,
  content: string,
  sourceCatalog?: UILanguageCatalog | null
): UILanguageCatalog {
  const language = normalizeInkuraLanguage(languageInput) ?? DEFAULT_GUEST_INKURA_LANGUAGE;
  const sections = parseRawSections(content).map((section) => ({
    name: section.name,
    entries: section.entries.map((entry) => parseEntryLine(language, entry.raw, entry.line)),
  }));

  const { sectionLookup, globalLookup } = buildSectionLookup(sections, language);
  const catalog: UILanguageCatalog = {
    language,
    sections,
    sectionLookup,
    globalLookup,
  };

  if (language !== "EN" && sourceCatalog) {
    validateTranslatedCatalog(catalog, sourceCatalog);
  }

  return catalog;
}

export function lookupUILanguageText(
  catalog: UILanguageCatalog,
  sourceText: string,
  options: UILanguageLookupOptions = {}
) {
  const normalizedSource = sourceText.trim();
  if (!normalizedSource) return sourceText;

  const sectionName = options.section?.trim();
  const fromSection = sectionName ? catalog.sectionLookup[sectionName]?.[normalizedSource] : undefined;
  if (fromSection) return fromSection;

  const fromGlobal = catalog.globalLookup[normalizedSource];
  if (fromGlobal) return fromGlobal;

  const fallbackSection = sectionName ? options.fallbackCatalog?.sectionLookup[sectionName]?.[normalizedSource] : undefined;
  if (fallbackSection) return fallbackSection;

  const fallbackGlobal = options.fallbackCatalog?.globalLookup[normalizedSource];
  if (fallbackGlobal) return fallbackGlobal;

  return normalizedSource;
}

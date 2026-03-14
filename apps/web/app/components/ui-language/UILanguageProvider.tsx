"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";

import {
  DEFAULT_GUEST_INKURA_LANGUAGE,
  inkuraLanguageToHtmlLang,
  resolveInkuraLanguage,
  type InkuraLanguageCode,
} from "@/lib/inkuraLanguage";
import { resolveClientInkuraLanguage } from "@/lib/uiLanguageBootstrap";
import {
  canonicalizeUILanguageText,
  lookupUILanguageText,
  type UILanguageCatalog,
  type UILanguageLookupOptions,
} from "@/lib/uiLanguageCatalog";

type UILanguageCatalogMap = Record<InkuraLanguageCode, UILanguageCatalog>;

export type TranslateOptions = Omit<UILanguageLookupOptions, "fallbackCatalog">;

type UILanguageContextValue = {
  language: InkuraLanguageCode;
  sourceLanguage: InkuraLanguageCode;
  catalog: UILanguageCatalog;
  sourceCatalog: UILanguageCatalog;
  catalogs: UILanguageCatalogMap;
  setLanguage: (nextLanguage: unknown) => void;
  t: (sourceText: string, options?: TranslateOptions) => string;
};

const UILanguageContext = createContext<UILanguageContextValue | null>(null);

const AUTO_TRANSLATE_ATTRIBUTE_NAMES = ["placeholder", "title", "aria-label", "alt"] as const;
const AUTO_TRANSLATE_IGNORE_SELECTOR = [
  "script",
  "style",
  "noscript",
  "textarea",
  "code",
  "pre",
  "[contenteditable='true']",
  "[data-ui-language-ignore='true']",
  ".ProseMirror",
  ".novel-reader-surface",
  ".tiptap",
  ".ql-editor",
].join(",");

const PARTIAL_TRANSLATION_SELECTOR = [
  "button",
  "a",
  "label",
  "option",
  "summary",
  "th",
  "td",
  "li",
  "[role='button']",
  "[role='link']",
  "[role='menuitem']",
  "[role='tab']",
  "[role='option']",
  "[role='switch']",
  "[data-ui-language-partial='true']",
].join(",");

type PartialCandidate = {
  candidate: string;
  source: string;
};

function getCatalogOrFallback(catalogs: UILanguageCatalogMap, languageInput: unknown) {
  const language = resolveInkuraLanguage(languageInput);
  return catalogs[language] ?? catalogs[DEFAULT_GUEST_INKURA_LANGUAGE];
}

function buildSourceMap(catalog: UILanguageCatalog) {
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

function buildReverseLookup(catalogs: UILanguageCatalogMap) {
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

function buildPartialCandidates(catalogs: UILanguageCatalogMap, sourceCatalog: UILanguageCatalog) {
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

function shouldIgnoreElement(element: Element | null) {
  if (!element) return true;
  return !!element.closest(AUTO_TRANSLATE_IGNORE_SELECTOR);
}

function canPartiallyTranslate(element: Element | null) {
  if (!element || shouldIgnoreElement(element)) return false;
  return !!element.closest(PARTIAL_TRANSLATION_SELECTOR);
}

function translateDocumentTitle(
  catalog: UILanguageCatalog,
  sourceCatalog: UILanguageCatalog,
  sourceMap: Map<string, string>,
  reverseLookup: Map<string, string>,
  sourceRef: { current: string | null }
) {
  if (typeof document === "undefined") return;
  const current = document.title?.trim();
  if (!current) return;

  let source = sourceRef.current;
  const translatedFromStored =
    source ? lookupUILanguageText(catalog, source, { fallbackCatalog: sourceCatalog }) : null;

  if (!source || (current !== source && current !== translatedFromStored)) {
    const canonicalCurrent = canonicalizeUILanguageText(current);
    source = sourceMap.get(canonicalCurrent) ?? reverseLookup.get(canonicalCurrent) ?? null;
    sourceRef.current = source;
  }

  if (!source) return;
  document.title = lookupUILanguageText(catalog, source, { fallbackCatalog: sourceCatalog });
}

function replaceKnownPhrases(
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

export default function UILanguageProvider({
  children,
  catalogs,
  initialLanguage = DEFAULT_GUEST_INKURA_LANGUAGE,
}: {
  children: React.ReactNode;
  catalogs: UILanguageCatalogMap;
  initialLanguage?: InkuraLanguageCode;
}) {
  const { data: session, status } = useSession();
  const sourceCatalog = getCatalogOrFallback(catalogs, DEFAULT_GUEST_INKURA_LANGUAGE);
  const [language, setLanguageState] = useState<InkuraLanguageCode>(() => resolveInkuraLanguage(initialLanguage));
  const textNodeSourceRef = useRef(new WeakMap<Text, string>());
  const attributeSourceRef = useRef(new WeakMap<Element, Map<string, string>>());
  const titleSourceRef = useRef<string | null>(null);

  useEffect(() => {
    setLanguageState((current) => {
      const nextLanguage = resolveClientInkuraLanguage({
        status,
        sessionLanguage: (session?.user as any)?.inkuraLanguage,
        initialLanguage: resolveInkuraLanguage(initialLanguage),
        currentLanguage: current,
      });

      return current === nextLanguage ? current : nextLanguage;
    });
  }, [initialLanguage, session, status]);

  useEffect(() => {
    document.documentElement.lang = inkuraLanguageToHtmlLang(language);
  }, [language]);

  const setLanguage = useCallback((nextLanguage: unknown) => {
    setLanguageState(resolveInkuraLanguage(nextLanguage));
  }, []);

  const value = useMemo<UILanguageContextValue>(() => {
    const catalog = getCatalogOrFallback(catalogs, language);

    return {
      language,
      sourceLanguage: DEFAULT_GUEST_INKURA_LANGUAGE,
      catalog,
      sourceCatalog,
      catalogs,
      setLanguage,
      t: (sourceText: string, options: TranslateOptions = {}) =>
        lookupUILanguageText(catalog, sourceText, {
          ...options,
          fallbackCatalog: sourceCatalog,
        }),
    };
  }, [catalogs, language, setLanguage, sourceCatalog]);

  useEffect(() => {
    if (typeof document === "undefined" || !document.body) return;

    const activeCatalog = value.catalog;
    const sourceMap = buildSourceMap(sourceCatalog);
    const reverseLookup = buildReverseLookup(catalogs);
    const partialCandidates = buildPartialCandidates(catalogs, sourceCatalog);
    let animationFrame = 0;

    const resolveSourceText = (rawValue: string) => {
      const canonical = canonicalizeUILanguageText(rawValue);
      if (!canonical) return null;
      return sourceMap.get(canonical) ?? reverseLookup.get(canonical) ?? null;
    };

    const translateFromSource = (sourceText: string) =>
      lookupUILanguageText(activeCatalog, sourceText, { fallbackCatalog: sourceCatalog });

    const translateTextNode = (node: Text) => {
      const parentElement = node.parentElement;
      if (shouldIgnoreElement(parentElement)) return;

      const rawValue = node.nodeValue ?? "";
      const match = rawValue.match(/^(\s*)([\s\S]*?)(\s*)$/);
      const trimmed = match?.[2]?.trim() ?? "";
      if (!trimmed) return;

      let sourceText = textNodeSourceRef.current.get(node) ?? null;
      if (sourceText) {
        const translatedFromStored = translateFromSource(sourceText);
        if (trimmed !== sourceText && trimmed !== translatedFromStored) {
          sourceText = resolveSourceText(trimmed);
          if (!sourceText) {
            textNodeSourceRef.current.delete(node);
          } else {
            textNodeSourceRef.current.set(node, sourceText);
          }
        }
      }

      if (!sourceText) {
        sourceText = resolveSourceText(trimmed);
        if (sourceText) {
          textNodeSourceRef.current.set(node, sourceText);
        }
      }

      if (sourceText) {
        const translated = translateFromSource(sourceText);
        const nextValue = `${match?.[1] ?? ""}${translated}${match?.[3] ?? ""}`;
        if (node.nodeValue !== nextValue) {
          node.nodeValue = nextValue;
        }
        return;
      }

      const allowSoftPartial = trimmed.length <= 60;
      if (!canPartiallyTranslate(parentElement) && !allowSoftPartial) return;
      const replaced = replaceKnownPhrases(rawValue, activeCatalog, sourceCatalog, partialCandidates);
      if (replaced !== rawValue) {
        node.nodeValue = replaced;
      }
    };

    const translateAttributes = (element: Element) => {
      if (shouldIgnoreElement(element)) return;

      let storedAttributes = attributeSourceRef.current.get(element);
      if (!storedAttributes) {
        storedAttributes = new Map<string, string>();
        attributeSourceRef.current.set(element, storedAttributes);
      }

      for (const attributeName of AUTO_TRANSLATE_ATTRIBUTE_NAMES) {
        const currentValue = element.getAttribute(attributeName);
        if (!currentValue || !currentValue.trim()) continue;

        let sourceText = storedAttributes.get(attributeName) ?? null;
        if (sourceText) {
          const translatedFromStored = translateFromSource(sourceText);
          if (currentValue !== sourceText && currentValue !== translatedFromStored) {
            sourceText = resolveSourceText(currentValue);
            if (!sourceText) {
              storedAttributes.delete(attributeName);
            } else {
              storedAttributes.set(attributeName, sourceText);
            }
          }
        }

        if (!sourceText) {
          sourceText = resolveSourceText(currentValue);
          if (sourceText) {
            storedAttributes.set(attributeName, sourceText);
          }
        }

        if (sourceText) {
          const translated = translateFromSource(sourceText);
          if (currentValue !== translated) {
            element.setAttribute(attributeName, translated);
          }
          continue;
        }

        if (!canPartiallyTranslate(element)) continue;
        const replaced = replaceKnownPhrases(currentValue, activeCatalog, sourceCatalog, partialCandidates);
        if (replaced !== currentValue) {
          element.setAttribute(attributeName, replaced);
        }
      }
    };

    const translateRoot = (rootNode: ParentNode) => {
      if (rootNode instanceof Element) {
        translateAttributes(rootNode);
      }

      const elementWalker = document.createTreeWalker(rootNode, NodeFilter.SHOW_ELEMENT);
      let currentElement = elementWalker.currentNode as Element | null;
      while (currentElement) {
        translateAttributes(currentElement);
        currentElement = elementWalker.nextNode() as Element | null;
      }

      const textWalker = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT);
      let currentTextNode = textWalker.currentNode as Text | null;
      while (currentTextNode) {
        translateTextNode(currentTextNode);
        currentTextNode = textWalker.nextNode() as Text | null;
      }
    };

    const runTranslation = () => {
      animationFrame = 0;
      translateDocumentTitle(activeCatalog, sourceCatalog, sourceMap, reverseLookup, titleSourceRef);
      translateRoot(document.body);
    };

    const scheduleTranslation = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(runTranslation);
    };

    scheduleTranslation();

    const observer = new MutationObserver(() => {
      scheduleTranslation();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...AUTO_TRANSLATE_ATTRIBUTE_NAMES],
    });

    return () => {
      observer.disconnect();
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, [catalogs, sourceCatalog, value.catalog]);

  return <UILanguageContext.Provider value={value}>{children}</UILanguageContext.Provider>;
}

export function useUILanguage() {
  const value = useContext(UILanguageContext);
  if (!value) {
    throw new Error("useUILanguage must be used inside <UILanguageProvider>.");
  }
  return value;
}

export function useUILanguageText(section?: string | null) {
  const value = useContext(UILanguageContext);

  return useCallback(
    (sourceText: string, options: Omit<TranslateOptions, "section"> = {}) => {
      if (!value) return sourceText;
      return value.t(sourceText, {
        ...options,
        section,
      });
    },
    [section, value]
  );
}

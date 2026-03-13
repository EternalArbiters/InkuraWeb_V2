"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";

import {
  DEFAULT_GUEST_INKURA_LANGUAGE,
  inkuraLanguageToHtmlLang,
  resolveInkuraLanguage,
  type InkuraLanguageCode,
} from "@/lib/inkuraLanguage";
import {
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

function getCatalogOrFallback(catalogs: UILanguageCatalogMap, languageInput: unknown) {
  const language = resolveInkuraLanguage(languageInput);
  return catalogs[language] ?? catalogs[DEFAULT_GUEST_INKURA_LANGUAGE];
}

function buildSourceSet(catalog: UILanguageCatalog) {
  const values = new Set<string>();
  for (const section of catalog.sections) {
    for (const entry of section.entries) {
      const source = entry.source.trim();
      if (source) values.add(source);
    }
  }
  return values;
}

function buildReverseLookup(catalog: UILanguageCatalog) {
  const lookup = new Map<string, string>();
  const duplicates = new Set<string>();

  for (const section of catalog.sections) {
    for (const entry of section.entries) {
      const target = entry.target.trim();
      const source = entry.source.trim();
      if (!target || !source || target === source) continue;

      if (lookup.has(target) && lookup.get(target) !== source) {
        duplicates.add(target);
        continue;
      }

      lookup.set(target, source);
    }
  }

  for (const duplicate of duplicates) {
    lookup.delete(duplicate);
  }

  return lookup;
}

function shouldIgnoreElement(element: Element | null) {
  if (!element) return true;
  return !!element.closest(AUTO_TRANSLATE_IGNORE_SELECTOR);
}

function translateDocumentTitle(
  catalog: UILanguageCatalog,
  sourceCatalog: UILanguageCatalog,
  sourceSet: Set<string>,
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
    if (sourceSet.has(current)) {
      source = current;
    } else {
      source = reverseLookup.get(current) ?? null;
    }

    sourceRef.current = source;
  }

  if (!source) return;
  document.title = lookupUILanguageText(catalog, source, { fallbackCatalog: sourceCatalog });
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
    const nextLanguage =
      status === "authenticated"
        ? resolveInkuraLanguage((session?.user as any)?.inkuraLanguage)
        : DEFAULT_GUEST_INKURA_LANGUAGE;

    setLanguageState((current) => (current === nextLanguage ? current : nextLanguage));
  }, [session, status]);

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
    const sourceSet = buildSourceSet(sourceCatalog);
    const reverseLookup = buildReverseLookup(activeCatalog);
    let animationFrame = 0;

    const resolveSourceText = (rawValue: string) => {
      const trimmed = rawValue.trim();
      if (!trimmed) return null;
      if (sourceSet.has(trimmed)) return trimmed;
      return reverseLookup.get(trimmed) ?? null;
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
            return;
          }
          textNodeSourceRef.current.set(node, sourceText);
        }
      }

      if (!sourceText) {
        sourceText = resolveSourceText(trimmed);
        if (!sourceText) return;
        textNodeSourceRef.current.set(node, sourceText);
      }

      const translated = translateFromSource(sourceText);
      const nextValue = `${match?.[1] ?? ""}${translated}${match?.[3] ?? ""}`;
      if (node.nodeValue !== nextValue) {
        node.nodeValue = nextValue;
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
              continue;
            }
            storedAttributes.set(attributeName, sourceText);
          }
        }

        if (!sourceText) {
          sourceText = resolveSourceText(currentValue);
          if (!sourceText) continue;
          storedAttributes.set(attributeName, sourceText);
        }

        const translated = translateFromSource(sourceText);
        if (currentValue !== translated) {
          element.setAttribute(attributeName, translated);
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
      translateDocumentTitle(activeCatalog, sourceCatalog, sourceSet, reverseLookup, titleSourceRef);
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
  }, [sourceCatalog, value.catalog]);

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

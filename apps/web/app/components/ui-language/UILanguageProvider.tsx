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
  buildAutoTranslatePartialCandidates,
  buildAutoTranslateReverseLookup,
  buildAutoTranslateSourceMap,
  replaceAutoTranslateKnownPhrases,
  resolveAutoTranslateSourceText,
  shouldAllowAutoTranslatePartialReplacement,
  type AutoTranslateResolveMode,
} from "@/lib/uiLanguageAutoTranslate";
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

const EXPLICIT_PARTIAL_TRANSLATION_SELECTOR = "[data-ui-language-partial='true']";
// Partial replacement is intentionally opt-in only. It is too risky to run globally because
// mixed content and already-localized text can be mutated incorrectly.

function getCatalogOrFallback(catalogs: UILanguageCatalogMap, languageInput: unknown) {
  const language = resolveInkuraLanguage(languageInput);
  return catalogs[language] ?? catalogs[DEFAULT_GUEST_INKURA_LANGUAGE];
}

function shouldIgnoreElement(element: Element | null) {
  if (!element) return true;
  return !!element.closest(AUTO_TRANSLATE_IGNORE_SELECTOR);
}

function canPartiallyTranslate(element: Element | null) {
  if (!element || shouldIgnoreElement(element)) return false;
  return shouldAllowAutoTranslatePartialReplacement({
    hasExplicitOptIn: !!element.closest(EXPLICIT_PARTIAL_TRANSLATION_SELECTOR),
  });
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
    const sourceMap = buildAutoTranslateSourceMap(sourceCatalog);
    const reverseLookup = buildAutoTranslateReverseLookup(catalogs);
    const partialCandidates = buildAutoTranslatePartialCandidates(catalogs, sourceCatalog);
    const pendingRoots = new Set<ParentNode>();
    const pendingAttributeElements = new Set<Element>();
    const pendingTextNodes = new Set<Text>();
    let fullDocumentRequested = false;
    let animationFrame = 0;

    const clearPendingQueues = () => {
      pendingRoots.clear();
      pendingAttributeElements.clear();
      pendingTextNodes.clear();
    };

    const resolveSourceText = (rawValue: string, mode: AutoTranslateResolveMode) =>
      resolveAutoTranslateSourceText(rawValue, {
        mode,
        sourceMap,
        reverseLookup,
      });

    const translateFromSource = (sourceText: string) =>
      lookupUILanguageText(activeCatalog, sourceText, { fallbackCatalog: sourceCatalog });

    const translateTextNode = (node: Text, mode: AutoTranslateResolveMode) => {
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
          sourceText = resolveSourceText(trimmed, mode);
          if (!sourceText) {
            textNodeSourceRef.current.delete(node);
          } else {
            textNodeSourceRef.current.set(node, sourceText);
          }
        }
      }

      if (!sourceText) {
        sourceText = resolveSourceText(trimmed, mode);
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

      if (!canPartiallyTranslate(parentElement)) return;
      const replaced = replaceAutoTranslateKnownPhrases(rawValue, activeCatalog, sourceCatalog, partialCandidates);
      if (replaced !== rawValue) {
        node.nodeValue = replaced;
      }
    };

    const translateAttributes = (element: Element, mode: AutoTranslateResolveMode) => {
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
            sourceText = resolveSourceText(currentValue, mode);
            if (!sourceText) {
              storedAttributes.delete(attributeName);
            } else {
              storedAttributes.set(attributeName, sourceText);
            }
          }
        }

        if (!sourceText) {
          sourceText = resolveSourceText(currentValue, mode);
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
        const replaced = replaceAutoTranslateKnownPhrases(currentValue, activeCatalog, sourceCatalog, partialCandidates);
        if (replaced !== currentValue) {
          element.setAttribute(attributeName, replaced);
        }
      }
    };

    const translateRoot = (rootNode: ParentNode, mode: AutoTranslateResolveMode) => {
      if (rootNode instanceof Element) {
        translateAttributes(rootNode, mode);
      }

      const elementWalker = document.createTreeWalker(rootNode, NodeFilter.SHOW_ELEMENT);
      let currentElement = elementWalker.currentNode as Element | null;
      while (currentElement) {
        translateAttributes(currentElement, mode);
        currentElement = elementWalker.nextNode() as Element | null;
      }

      const textWalker = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT);
      let currentTextNode = textWalker.currentNode as Text | null;
      while (currentTextNode) {
        translateTextNode(currentTextNode, mode);
        currentTextNode = textWalker.nextNode() as Text | null;
      }
    };

    const scheduleTranslation = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(runTranslation);
    };

    const queueFullDocumentTranslation = () => {
      fullDocumentRequested = true;
      scheduleTranslation();
    };

    const queueRootTranslation = (rootNode: ParentNode | null) => {
      if (!rootNode) return;
      pendingRoots.add(rootNode);
      scheduleTranslation();
    };

    const queueAttributeTranslation = (element: Element | null) => {
      if (!element) return;
      pendingAttributeElements.add(element);
      scheduleTranslation();
    };

    const queueTextTranslation = (node: Text | null) => {
      if (!node) return;
      pendingTextNodes.add(node);
      scheduleTranslation();
    };

    const flushIncrementalQueues = () => {
      for (const element of pendingAttributeElements) {
        translateAttributes(element, "incremental");
      }

      for (const textNode of pendingTextNodes) {
        translateTextNode(textNode, "incremental");
      }

      for (const rootNode of pendingRoots) {
        translateRoot(rootNode, "incremental");
      }

      clearPendingQueues();
    };

    const runTranslation = () => {
      animationFrame = 0;
      translateDocumentTitle(activeCatalog, sourceCatalog, sourceMap, reverseLookup, titleSourceRef);

      if (fullDocumentRequested) {
        fullDocumentRequested = false;
        clearPendingQueues();
        translateRoot(document.body, "full");
        return;
      }

      flushIncrementalQueues();
    };

    queueFullDocumentTranslation();

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "childList") {
          for (const addedNode of Array.from(record.addedNodes)) {
            if (addedNode instanceof Element || addedNode instanceof DocumentFragment) {
              queueRootTranslation(addedNode);
              continue;
            }

            if (addedNode instanceof Text) {
              queueTextTranslation(addedNode);
            }
          }
          continue;
        }

        if (record.type === "characterData" && record.target instanceof Text) {
          queueTextTranslation(record.target);
          continue;
        }

        if (record.type === "attributes" && record.target instanceof Element) {
          queueAttributeTranslation(record.target);
        }
      }
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

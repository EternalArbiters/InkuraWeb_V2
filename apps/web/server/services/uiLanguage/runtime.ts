import "server-only";

import { cache } from "react";

import { DEFAULT_GUEST_INKURA_LANGUAGE, resolveInkuraLanguage } from "@/lib/inkuraLanguage";
import { lookupUILanguageText, type UILanguageLookupOptions } from "@/lib/uiLanguageCatalog";
import { getViewerBasic } from "@/server/services/works/viewer";
import { getSourceUILanguageCatalog, getUILanguageCatalog } from "@/server/services/uiLanguage/catalog";

export const getActiveInkuraLanguage = cache(async () => {
  const viewer = await getViewerBasic();
  return resolveInkuraLanguage(viewer?.inkuraLanguage, DEFAULT_GUEST_INKURA_LANGUAGE);
});

export const getActiveUILanguageCatalog = cache(async () => {
  const language = await getActiveInkuraLanguage();
  return getUILanguageCatalog(language);
});

export async function getActiveUILanguageText(
  sourceText: string,
  options: Omit<UILanguageLookupOptions, "fallbackCatalog"> = {}
) {
  const [catalog, sourceCatalog] = await Promise.all([getActiveUILanguageCatalog(), getSourceUILanguageCatalog()]);

  return lookupUILanguageText(catalog, sourceText, {
    ...options,
    fallbackCatalog: sourceCatalog,
  });
}

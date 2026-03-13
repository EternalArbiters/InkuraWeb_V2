import "server-only";

import { cache } from "react";
import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  lookupUILanguageText,
  parseUILanguageCatalog,
  type UILanguageCatalog,
  type UILanguageLookupOptions,
} from "@/lib/uiLanguageCatalog";
import {
  DEFAULT_GUEST_INKURA_LANGUAGE,
  INKURA_LANGUAGE_CODES,
  normalizeInkuraLanguage,
  type InkuraLanguageCode,
} from "@/lib/inkuraLanguage";

const UI_LANGUAGE_DIRECTORY = path.join(process.cwd(), "UIlanguage");

async function readUILanguageFile(language: InkuraLanguageCode) {
  return readFile(path.join(UI_LANGUAGE_DIRECTORY, language), "utf8");
}

export const getSourceUILanguageCatalog = cache(async (): Promise<UILanguageCatalog> => {
  const content = await readUILanguageFile("EN");
  return parseUILanguageCatalog("EN", content, null);
});

export const getUILanguageCatalog = cache(async (languageInput: unknown): Promise<UILanguageCatalog> => {
  const language = normalizeInkuraLanguage(languageInput) ?? DEFAULT_GUEST_INKURA_LANGUAGE;
  if (language === "EN") return getSourceUILanguageCatalog();

  const [content, sourceCatalog] = await Promise.all([readUILanguageFile(language), getSourceUILanguageCatalog()]);
  return parseUILanguageCatalog(language, content, sourceCatalog);
});

export const getAllUILanguageCatalogs = cache(async (): Promise<Record<InkuraLanguageCode, UILanguageCatalog>> => {
  const entries = await Promise.all(
    INKURA_LANGUAGE_CODES.map(async (language) => [language, await getUILanguageCatalog(language)] as const)
  );
  return Object.fromEntries(entries) as Record<InkuraLanguageCode, UILanguageCatalog>;
});

export async function getUILanguageText(
  languageInput: unknown,
  sourceText: string,
  options: Omit<UILanguageLookupOptions, "fallbackCatalog"> = {}
) {
  const [catalog, sourceCatalog] = await Promise.all([
    getUILanguageCatalog(languageInput),
    getSourceUILanguageCatalog(),
  ]);

  return lookupUILanguageText(catalog, sourceText, {
    ...options,
    fallbackCatalog: sourceCatalog,
  });
}

export const INKURA_LANGUAGE_CODES = ["EN", "ID"] as const;

export type InkuraLanguageCode = (typeof INKURA_LANGUAGE_CODES)[number];

export const INKURA_LANGUAGE_OPTIONS: ReadonlyArray<{
  code: InkuraLanguageCode;
  label: string;
}> = [
  { code: "EN", label: "English" },
  { code: "ID", label: "Indonesia" },
] as const;

export function normalizeInkuraLanguage(input: unknown): InkuraLanguageCode | null {
  if (typeof input !== "string") return null;
  const normalized = input.trim().toUpperCase();
  return INKURA_LANGUAGE_CODES.includes(normalized as InkuraLanguageCode)
    ? (normalized as InkuraLanguageCode)
    : null;
}

export const DEFAULT_GUEST_INKURA_LANGUAGE: InkuraLanguageCode = "EN";

export function resolveInkuraLanguage(
  preferredLanguage: unknown,
  fallbackLanguage: InkuraLanguageCode = DEFAULT_GUEST_INKURA_LANGUAGE
): InkuraLanguageCode {
  return normalizeInkuraLanguage(preferredLanguage) ?? fallbackLanguage;
}

export function inkuraLanguageToHtmlLang(languageInput: unknown) {
  return resolveInkuraLanguage(languageInput) === "ID" ? "id" : "en";
}

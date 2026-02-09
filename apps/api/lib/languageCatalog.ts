// Language options for works (simple MVP list).
// Stored in Work.language as a lowercase code.

export type LanguageOption = { code: string; label: string };

export const LANGUAGE_CATALOG: LanguageOption[] = [
  { code: "id", label: "Indonesian" },
  { code: "en", label: "English" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "zh", label: "Chinese" },
  { code: "th", label: "Thai" },
  { code: "vi", label: "Vietnamese" },
  { code: "es", label: "Spanish" },
  { code: "pt", label: "Portuguese" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "ru", label: "Russian" },
  { code: "ar", label: "Arabic" },
  { code: "hi", label: "Hindi" },
  { code: "tr", label: "Turkish" },
  { code: "it", label: "Italian" },
  { code: "pl", label: "Polish" },
  { code: "ms", label: "Malay" },
  { code: "tl", label: "Tagalog" },
  { code: "other", label: "Other / Unknown" },
];

export function languageLabel(code: string) {
  const c = (code || "").toLowerCase();
  return LANGUAGE_CATALOG.find((x) => x.code === c)?.label || code || "Unknown";
}

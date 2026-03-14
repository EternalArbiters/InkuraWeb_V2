import {
  DEFAULT_GUEST_INKURA_LANGUAGE,
  resolveInkuraLanguage,
  type InkuraLanguageCode,
} from "@/lib/inkuraLanguage";

export function resolveClientInkuraLanguage({
  status,
  sessionLanguage,
  initialLanguage,
  currentLanguage,
}: {
  status: "authenticated" | "loading" | "unauthenticated";
  sessionLanguage: unknown;
  initialLanguage: InkuraLanguageCode;
  currentLanguage: InkuraLanguageCode;
}) {
  if (status === "loading") {
    return currentLanguage;
  }

  if (status === "authenticated") {
    return resolveInkuraLanguage(sessionLanguage, initialLanguage);
  }

  return DEFAULT_GUEST_INKURA_LANGUAGE;
}

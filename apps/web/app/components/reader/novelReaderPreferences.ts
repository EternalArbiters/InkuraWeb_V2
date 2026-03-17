export type NovelReaderMode = "scroll" | "slide";
export type NovelReaderTheme = "paper" | "midnight" | "sepia" | "mist" | "forest" | "rose";
export type NovelReaderFontFamily = "serif" | "sans" | "book" | "classic" | "mono";
export type NovelReaderLineSpacing = "comfortable" | "airy";

export type NovelReaderPreferences = {
  mode: NovelReaderMode;
  theme: NovelReaderTheme;
  fontScale: number;
  fontFamily: NovelReaderFontFamily;
  lineSpacing: NovelReaderLineSpacing;
};

export const NOVEL_READER_PREFERENCES_KEY = "inkura:novel-reader-preferences";
export const NOVEL_READER_PREFERENCES_EVENT = "inkura:novel-reader-preferences";

export const DEFAULT_NOVEL_READER_PREFERENCES: NovelReaderPreferences = {
  mode: "scroll",
  theme: "midnight",
  fontScale: 1,
  fontFamily: "serif",
  lineSpacing: "comfortable",
};

function clampFontScale(value: unknown) {
  const next = Number(value);
  if (!Number.isFinite(next)) return DEFAULT_NOVEL_READER_PREFERENCES.fontScale;
  return Math.max(0.9, Math.min(1.3, Number(next.toFixed(2))));
}

function normalizePreferences(input: Partial<NovelReaderPreferences> | null | undefined): NovelReaderPreferences {
  const mode = input?.mode === "slide" ? "slide" : "scroll";
  const theme =
    input?.theme === "paper" ||
    input?.theme === "sepia" ||
    input?.theme === "midnight" ||
    input?.theme === "mist" ||
    input?.theme === "forest" ||
    input?.theme === "rose"
      ? input.theme
      : DEFAULT_NOVEL_READER_PREFERENCES.theme;
  const fontFamily =
    input?.fontFamily === "sans" ||
    input?.fontFamily === "book" ||
    input?.fontFamily === "classic" ||
    input?.fontFamily === "mono"
      ? input.fontFamily
      : "serif";
  const lineSpacing = input?.lineSpacing === "airy" ? "airy" : "comfortable";

  return {
    mode,
    theme,
    fontScale: clampFontScale(input?.fontScale),
    fontFamily,
    lineSpacing,
  };
}

export function loadNovelReaderPreferences(): NovelReaderPreferences {
  if (typeof window === "undefined") return DEFAULT_NOVEL_READER_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(NOVEL_READER_PREFERENCES_KEY);
    if (!raw) return DEFAULT_NOVEL_READER_PREFERENCES;
    return normalizePreferences(JSON.parse(raw));
  } catch {
    return DEFAULT_NOVEL_READER_PREFERENCES;
  }
}

export function saveNovelReaderPreferences(nextInput: Partial<NovelReaderPreferences> | NovelReaderPreferences) {
  const next = normalizePreferences({
    ...DEFAULT_NOVEL_READER_PREFERENCES,
    ...nextInput,
  });

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(NOVEL_READER_PREFERENCES_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent(NOVEL_READER_PREFERENCES_EVENT, { detail: next }));
    } catch {}
  }

  return next;
}

export function updateNovelReaderPreferences(patch: Partial<NovelReaderPreferences>) {
  const current = loadNovelReaderPreferences();
  return saveNovelReaderPreferences({ ...current, ...patch });
}

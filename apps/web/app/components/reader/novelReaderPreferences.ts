import {
  Bodoni_Moda,
  Comic_Neue,
  Dancing_Script,
  EB_Garamond,
  GFS_Didot,
  Roboto_Slab,
  Special_Elite,
} from "next/font/google";

const comicNeue = Comic_Neue({ subsets: ["latin"], weight: ["400", "700"], display: "swap" });
const specialElite = Special_Elite({ subsets: ["latin"], weight: "400", display: "swap" });
const gfsDidot = GFS_Didot({ subsets: ["latin"], weight: "400", display: "swap" });
const bodoniModa = Bodoni_Moda({ subsets: ["latin"], weight: ["400", "600", "700"], display: "swap" });
const ebGaramond = EB_Garamond({ subsets: ["latin"], weight: ["400", "500", "700"], display: "swap" });
const dancingScript = Dancing_Script({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });
const robotoSlab = Roboto_Slab({ subsets: ["latin"], weight: ["400", "500", "700"], display: "swap" });

export type NovelReaderMode = "scroll" | "slide";
export type NovelReaderTheme = "paper" | "midnight" | "sepia" | "mist" | "forest" | "rose";
export type NovelReaderFontFamily =
  | "serif"
  | "sansSerif"
  | "monospace"
  | "comic"
  | "typewriter"
  | "didot"
  | "bodoni"
  | "garamond"
  | "dancingScript"
  | "itcLubalinGraph";
export type NovelReaderLineSpacing = "comfortable" | "airy";

export type NovelReaderPreferences = {
  mode: NovelReaderMode;
  theme: NovelReaderTheme;
  fontScale: number;
  fontFamily: NovelReaderFontFamily;
  lineSpacing: NovelReaderLineSpacing;
};

export type NovelReaderThemeOption = {
  value: NovelReaderTheme;
  labelKey: string;
  swatchClassName: string;
};

export type NovelReaderFontOption = {
  value: NovelReaderFontFamily;
  labelKey: string;
  previewText: string;
  previewClassName: string;
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

export const NOVEL_READER_THEME_OPTIONS: NovelReaderThemeOption[] = [
  {
    value: "paper",
    labelKey: "Paper",
    swatchClassName: "border-slate-200 bg-[#f7f5ef]",
  },
  {
    value: "midnight",
    labelKey: "Midnight",
    swatchClassName: "border-[#17243d] bg-[#030917]",
  },
  {
    value: "sepia",
    labelKey: "Sepia",
    swatchClassName: "border-[#d9c7a3] bg-[#efe3cb]",
  },
  {
    value: "mist",
    labelKey: "Mist",
    swatchClassName: "border-[#bfd0e7] bg-[#e7edf5]",
  },
  {
    value: "forest",
    labelKey: "Forest",
    swatchClassName: "border-[#26433a] bg-[#0f1a16]",
  },
  {
    value: "rose",
    labelKey: "Rose",
    swatchClassName: "border-[#d9b9c7] bg-[#f5e8e8]",
  },
];

export const NOVEL_READER_FONT_OPTIONS: NovelReaderFontOption[] = [
  {
    value: "serif",
    labelKey: "Serif",
    previewText: "Serif",
    previewClassName: "font-serif text-[1.3rem] tracking-[0.01em]",
  },
  {
    value: "sansSerif",
    labelKey: "Sans Serif",
    previewText: "Sans",
    previewClassName: "font-sans text-[1.18rem]",
  },
  {
    value: "monospace",
    labelKey: "Monospace",
    previewText: "Mono",
    previewClassName: "font-mono text-[0.98rem] tracking-[0.02em]",
  },
  {
    value: "comic",
    labelKey: "Comic",
    previewText: "Comic",
    previewClassName: `${comicNeue.className} text-[1.12rem]`,
  },
  {
    value: "typewriter",
    labelKey: "Typewriter",
    previewText: "Type",
    previewClassName: `${specialElite.className} text-[0.94rem] tracking-[0.02em]`,
  },
  {
    value: "didot",
    labelKey: "Didot",
    previewText: "Didot",
    previewClassName: `${gfsDidot.className} text-[1.28rem]`,
  },
  {
    value: "bodoni",
    labelKey: "Bodoni",
    previewText: "Bodo",
    previewClassName: `${bodoniModa.className} text-[1.2rem] tracking-[0.015em]`,
  },
  {
    value: "garamond",
    labelKey: "Garamond",
    previewText: "Gara",
    previewClassName: `${ebGaramond.className} text-[1.08rem]`,
  },
  {
    value: "dancingScript",
    labelKey: "Dancing Script",
    previewText: "Dance",
    previewClassName: `${dancingScript.className} text-[1.3rem]`,
  },
  {
    value: "itcLubalinGraph",
    labelKey: "ITC Lubalin Graph",
    previewText: "ITC",
    previewClassName: `${robotoSlab.className} text-[0.95rem] font-semibold leading-tight`,
  },
];

function clampFontScale(value: unknown) {
  const next = Number(value);
  if (!Number.isFinite(next)) return DEFAULT_NOVEL_READER_PREFERENCES.fontScale;
  return Math.max(0.9, Math.min(1.3, Number(next.toFixed(2))));
}

function normalizeFontFamily(value: unknown): NovelReaderFontFamily {
  switch (value) {
    case "sansSerif":
    case "sans":
      return "sansSerif";
    case "monospace":
    case "mono":
      return "monospace";
    case "comic":
    case "book":
      return "comic";
    case "typewriter":
      return "typewriter";
    case "didot":
      return "didot";
    case "bodoni":
      return "bodoni";
    case "baskerville":
    case "classic":
      return "serif";
    case "garamond":
      return "garamond";
    case "dancingScript":
    case "script":
      return "dancingScript";
    case "itcLubalinGraph":
      return "itcLubalinGraph";
    case "serif":
    default:
      return "serif";
  }
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

  const lineSpacing = input?.lineSpacing === "airy" ? "airy" : "comfortable";

  return {
    mode,
    theme,
    fontScale: clampFontScale(input?.fontScale),
    fontFamily: normalizeFontFamily(input?.fontFamily),
    lineSpacing,
  };
}

export function getNovelReaderFontFamilyValue(fontFamily: NovelReaderPreferences["fontFamily"]) {
  switch (fontFamily) {
    case "sansSerif":
      return "var(--font-geist-sans, ui-sans-serif, system-ui, sans-serif)";
    case "monospace":
      return '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace';
    case "comic":
      return `"Comic Neue", ${comicNeue.style.fontFamily}, "Comic Sans MS", cursive`;
    case "typewriter":
      return `"Special Elite", ${specialElite.style.fontFamily}, "Courier New", monospace`;
    case "didot":
      return `Didot, ${gfsDidot.style.fontFamily}, serif`;
    case "bodoni":
      return `"Bodoni 72", ${bodoniModa.style.fontFamily}, serif`;
    case "garamond":
      return `Garamond, ${ebGaramond.style.fontFamily}, serif`;
    case "dancingScript":
      return `"Dancing Script", ${dancingScript.style.fontFamily}, cursive`;
    case "itcLubalinGraph":
      return `"ITC Lubalin Graph", "Lubalin Graph", ${robotoSlab.style.fontFamily}, Rockwell, serif`;
    case "serif":
    default:
      return "Georgia, Cambria, 'Times New Roman', Times, serif";
  }
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

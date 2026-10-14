"use client";

import { createContext, useContext } from "react";

/**
 * UI Theme = the overall look-and-feel of the site. Inkura has committed to the
 * "modern" redesign, so this is now permanently `"modern"` — the classic/modern
 * switch has been retired. The value is still exposed through context so
 * existing consumers keep working while pages are migrated to the modern look
 * one by one.
 *
 * The `data-ui-theme="modern"` attribute that every `--ink-*` CSS token in
 * globals.css is scoped under now lives directly on `<html>` in app/layout.tsx
 * — it used to be injected by a `UIThemeScript` render-blocking inline script
 * (same pattern as DarkModeScript below). That worked on most routes, but on
 * ones with a slow/streamed render (e.g. /w/[slug], which awaits several
 * parallel fetches) the attribute silently failed to stick — every `--ink-*`
 * token resolved to nothing there, so anything using one as a background (the
 * chapter list rows, for instance) fell through to transparent and showed
 * whatever was behind it instead. A literal SSR'd attribute can't have that
 * problem: it's present in the very first bytes of the response, same as
 * data-inkura-language right next to it, independent of any client-side script
 * ever running. v37 — if you're tempted to reintroduce a UIThemeScript-style
 * injected attribute for some future *actually conditional* value, keep this
 * failure mode in mind.
 *
 * NOTE: This is a separate axis from light/dark mode (the `.dark` class + the
 * `theme` localStorage key), which is unaffected.
 */

export type UITheme = "modern";

export const UI_THEME_STORAGE_KEY = "inkura-ui-theme";
export const DEFAULT_UI_THEME: UITheme = "modern";

type UIThemeContextValue = {
  uiTheme: UITheme;
  /** Retained for API compatibility — always true now. */
  ready: boolean;
  /** No-op: the theme is fixed to "modern". */
  setUITheme: (theme: UITheme) => void;
  /** No-op: the theme is fixed to "modern". */
  toggleUITheme: () => void;
};

const FIXED_VALUE: UIThemeContextValue = {
  uiTheme: "modern",
  ready: true,
  setUITheme: () => {},
  toggleUITheme: () => {},
};

const UIThemeContext = createContext<UIThemeContextValue>(FIXED_VALUE);

export function UIThemeProvider({ children }: { children: React.ReactNode }) {
  return <UIThemeContext.Provider value={FIXED_VALUE}>{children}</UIThemeContext.Provider>;
}

export function useUITheme(): UIThemeContextValue {
  return useContext(UIThemeContext);
}

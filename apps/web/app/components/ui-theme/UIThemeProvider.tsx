"use client";

import { createContext, useContext } from "react";

/**
 * UI Theme = the overall look-and-feel of the site. Inkura has committed to the
 * "modern" redesign, so this is now permanently `"modern"` — the classic/modern
 * switch has been retired. The value is still exposed through context (and the
 * `data-ui-theme="modern"` attribute on `<html>`) so existing consumers keep
 * working while pages are migrated to the modern look one by one.
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

/**
 * Inline, render-blocking script that pins the UI theme on <html> before first
 * paint so CSS targeting `[data-ui-theme="modern"]` applies without a flash.
 */
export function UIThemeScript() {
  const js = `document.documentElement.dataset.uiTheme='modern';`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}

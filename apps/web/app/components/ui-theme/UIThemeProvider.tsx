"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

/**
 * UI Theme = the overall look-and-feel of the site ("classic" = the original
 * Inkura UI, "modern" = the redesigned clean-minimalist UI). This is a separate
 * axis from light/dark mode (which is handled by the `.dark` class + `theme`
 * localStorage key). The active UI theme is reflected on `<html>` via the
 * `data-ui-theme` attribute so CSS can target it, and is also exposed through
 * React context so components can render genuinely different layouts.
 */

export type UITheme = "classic" | "modern";

export const UI_THEME_STORAGE_KEY = "inkura-ui-theme";
export const DEFAULT_UI_THEME: UITheme = "classic";

function normalizeUITheme(value: unknown): UITheme {
  return value === "modern" || value === "classic" ? value : DEFAULT_UI_THEME;
}

type UIThemeContextValue = {
  uiTheme: UITheme;
  /** True once the stored preference has been read on the client. */
  ready: boolean;
  setUITheme: (theme: UITheme) => void;
  toggleUITheme: () => void;
};

const UIThemeContext = createContext<UIThemeContextValue | null>(null);

export function UIThemeProvider({ children }: { children: React.ReactNode }) {
  const [uiTheme, setUIThemeState] = useState<UITheme>(DEFAULT_UI_THEME);
  const [ready, setReady] = useState(false);

  // Hydrate from the stored preference. The inline UIThemeScript already set the
  // `data-ui-theme` attribute before paint to avoid a flash; here we sync React
  // state so component-level branching matches.
  useEffect(() => {
    const stored = normalizeUITheme(localStorage.getItem(UI_THEME_STORAGE_KEY));
    setUIThemeState(stored);
    document.documentElement.dataset.uiTheme = stored;
    setReady(true);
  }, []);

  const setUITheme = useCallback((theme: UITheme) => {
    const next = normalizeUITheme(theme);
    setUIThemeState(next);
    try {
      localStorage.setItem(UI_THEME_STORAGE_KEY, next);
    } catch {
      // Ignore storage failures (private mode, etc.) — the in-memory state still applies.
    }
    document.documentElement.dataset.uiTheme = next;
  }, []);

  const toggleUITheme = useCallback(() => {
    setUITheme(uiTheme === "modern" ? "classic" : "modern");
  }, [uiTheme, setUITheme]);

  return (
    <UIThemeContext.Provider value={{ uiTheme, ready, setUITheme, toggleUITheme }}>
      {children}
    </UIThemeContext.Provider>
  );
}

export function useUITheme(): UIThemeContextValue {
  const ctx = useContext(UIThemeContext);
  if (!ctx) {
    throw new Error("useUITheme must be used within a UIThemeProvider");
  }
  return ctx;
}

/**
 * Inline, render-blocking script that applies the stored UI theme to <html>
 * before first paint. Render this as the first child of <body> so the attribute
 * is set synchronously and CSS-driven styling never flashes the wrong theme.
 */
export function UIThemeScript() {
  const js = `(function(){try{var t=localStorage.getItem('${UI_THEME_STORAGE_KEY}');if(t!=='modern'&&t!=='classic'){t='${DEFAULT_UI_THEME}';}document.documentElement.dataset.uiTheme=t;}catch(e){document.documentElement.dataset.uiTheme='${DEFAULT_UI_THEME}';}})();`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}

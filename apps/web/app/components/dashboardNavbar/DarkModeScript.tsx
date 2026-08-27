"use client";

/**
 * Inline, render-blocking script that applies the `.dark` class (from the
 * "theme" localStorage key) to <html> before first paint. Without this,
 * useThemeToggle.ts only applies `.dark` inside a useEffect — which runs
 * AFTER the browser's first paint — so any CSS variable that switches value
 * under `.dark` (e.g. --ink-border) briefly resolves to its light-mode value
 * first. That showed up as a near-white line flashing in under the navbar on
 * page load in dark mode. Mirrors UIThemeScript's identical pattern for the
 * separate (unrelated) `data-ui-theme` attribute.
 */
export function DarkModeScript() {
  const js = "try{if(localStorage.getItem('theme')==='dark'){document.documentElement.classList.add('dark');}}catch(e){}";
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}

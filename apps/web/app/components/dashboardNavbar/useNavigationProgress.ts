"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useNavigationProgress(pathname: string) {
  const [isNavigating, setIsNavigating] = useState(false);
  const [navProgress, setNavProgress] = useState(0);
  const navFallbackTimer = useRef<number | null>(null);
  const navProgressTimer = useRef<number | null>(null);

  const clearNavTimers = useCallback(() => {
    if (navFallbackTimer.current) {
      window.clearTimeout(navFallbackTimer.current);
      navFallbackTimer.current = null;
    }
    if (navProgressTimer.current) {
      window.clearInterval(navProgressTimer.current);
      navProgressTimer.current = null;
    }
  }, []);

  const startNavigation = useCallback(() => {
    setIsNavigating(true);
    setNavProgress((p) => (p > 0 ? p : 12));

    // Clear any previous timers
    clearNavTimers();

    // Simulated loading: ease towards 80% while waiting for the new route to paint
    navProgressTimer.current = window.setInterval(() => {
      setNavProgress((p) => {
        if (p >= 80) return p;
        const inc = Math.max(1, (80 - p) * 0.08);
        return Math.min(80, p + inc);
      });
    }, 120);

    // Fallback stop (in case navigation fails)
    navFallbackTimer.current = window.setTimeout(() => {
      clearNavTimers();
      setIsNavigating(false);
      setNavProgress(0);
    }, 6000);
  }, [clearNavTimers]);

  // Make the navbar divider show a loading-like progress during navigation.
  useEffect(() => {
    const onClickCapture = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      // only primary clicks
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      const a = target?.closest?.("a") as HTMLAnchorElement | null;
      if (!a) return;
      const rawHref = a.getAttribute("href") || "";
      if (!rawHref || rawHref.startsWith("#")) return;
      if (a.hasAttribute("download")) return;
      if (a.target && a.target !== "_self") return;

      // internal only
      try {
        const url = new URL(a.href, window.location.href);
        if (url.origin !== window.location.origin) return;
        if (url.href === window.location.href) return;
      } catch {
        return;
      }

      startNavigation();
    };

    document.addEventListener("click", onClickCapture, true);
    return () => {
      document.removeEventListener("click", onClickCapture, true);
      clearNavTimers();
    };
  }, [startNavigation, clearNavTimers]);

  useEffect(() => {
    // When route changes, complete the loading bar, then fade back to dim.
    if (!isNavigating) return;

    // Stop the simulated progress timer and clear fallback
    if (navProgressTimer.current) {
      window.clearInterval(navProgressTimer.current);
      navProgressTimer.current = null;
    }
    if (navFallbackTimer.current) {
      window.clearTimeout(navFallbackTimer.current);
      navFallbackTimer.current = null;
    }

    setNavProgress(100);
    const t1 = window.setTimeout(() => setIsNavigating(false), 220);
    const t2 = window.setTimeout(() => setNavProgress(0), 650);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [pathname, isNavigating]);

  return { isNavigating, navProgress, startNavigation };
}

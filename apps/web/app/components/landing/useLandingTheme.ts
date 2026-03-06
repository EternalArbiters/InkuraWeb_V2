"use client";

import * as React from "react";

export function useLandingTheme() {
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const isDark = localStorage.getItem("theme") === "dark";
    setIsDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleDarkMode = React.useCallback(() => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    if (typeof window === "undefined") return;
    localStorage.setItem("theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  }, [isDarkMode]);

  return { isDarkMode, toggleDarkMode };
}

"use client";

import { useCallback, useEffect, useState } from "react";

export function useThemeToggle() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Set theme
  useEffect(() => {
    const dark = localStorage.getItem("theme") === "dark";
    setIsDarkMode(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  const toggleDarkMode = useCallback(() => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
    document.documentElement.classList.toggle("dark", newTheme);
  }, [isDarkMode]);

  return { isDarkMode, toggleDarkMode };
}

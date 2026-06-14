"use client";

import { useUITheme } from "@/app/components/ui-theme/UIThemeProvider";

/**
 * Theme-aware page surface (the `<main>` background). In the modern UI it uses
 * the ink design tokens; in the classic UI it keeps the original white/dark
 * background. Lets server pages opt into the modern look without becoming client
 * components themselves (they pass their content as children).
 */
export default function ListSurface({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { uiTheme } = useUITheme();
  const isModern = uiTheme === "modern";

  return (
    <main
      className={`min-h-[calc(100vh-96px)] ${
        isModern
          ? "bg-[var(--ink-bg)] text-[var(--ink-fg)]"
          : "bg-white text-gray-900 dark:bg-gray-950 dark:text-white"
      } ${className || ""}`}
    >
      {children}
    </main>
  );
}

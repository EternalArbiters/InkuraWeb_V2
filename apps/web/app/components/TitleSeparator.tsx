"use client";

import { useUITheme } from "@/app/components/ui-theme/UIThemeProvider";

export default function TitleSeparator({ className = "mt-6" }: { className?: string }) {
  const { uiTheme } = useUITheme();
  if (uiTheme !== "modern") return null;
  return <div className={`h-px ${className}`} style={{ background: "var(--ink-border)" }} />;
}

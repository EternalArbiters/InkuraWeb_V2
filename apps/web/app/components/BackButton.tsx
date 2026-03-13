"use client";

import Link from "next/link";
import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";

export default function BackButton({
  href,
  className = "",
}: {
  href: string;
  className?: string;
}) {
  const t = useUILanguageText("Shared Components");

  return (
    <Link
      href={href}
      prefetch={false}
      className={
        "inline-flex items-center justify-center px-4 py-2 rounded-xl " +
        "border border-gray-200 dark:border-gray-800 " +
        "bg-white/70 dark:bg-gray-900/50 " +
        "hover:bg-gray-50 dark:hover:bg-gray-900 " +
        "text-sm font-semibold " +
        "transition " +
        className
      }
    >
      {t("Back")}
    </Link>
  );
}

"use client";

import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";

export default function LockLabel({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const t = useUILanguageText();
  return (
    <span className={`inline-flex items-center gap-2 ${className}`.trim()}>
      <LockIcon />
      <span>{t(text)}</span>
    </span>
  );
}

function LockIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M7.5 10.5V8a4.5 4.5 0 119 0v2.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M7 10.5h10a2 2 0 012 2v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7a2 2 0 012-2z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 14v3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

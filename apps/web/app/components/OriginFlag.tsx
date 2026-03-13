"use client";

// Renders country flags as images so desktop (Windows) also shows flags consistently.
// Uses Twemoji CDN for stability.

import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";

export default function OriginFlag({
  emoji,
  className = "",
  title = "Origin",
}: {
  emoji: string;
  className?: string;
  title?: string;
}) {
  const t = useUILanguageText();
  const translatedTitle = t(title);
  const codepoints = Array.from(emoji).map((ch) => ch.codePointAt(0) || 0);
  const isFlag =
    codepoints.length === 2 &&
    codepoints.every((cp) => cp >= 0x1f1e6 && cp <= 0x1f1ff);

  if (!isFlag) {
    return (
      <span className={className} title={translatedTitle} aria-label={translatedTitle}>
        {emoji}
      </span>
    );
  }

  const hex = codepoints.map((cp) => cp.toString(16)).join("-");
  const src = `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/${hex}.png`;

  return (
    <img
      src={src}
      alt={emoji}
      title={translatedTitle}
      className={`inline-block h-[14px] w-[14px] ${className}`.trim()}
      loading="lazy"
    />
  );
}

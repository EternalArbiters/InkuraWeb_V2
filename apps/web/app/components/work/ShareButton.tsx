"use client";

import { useEffect, useState } from "react";
import { Share2, Link2 } from "lucide-react";

type Props = {
  title: string;
  className?: string;
};

export default function ShareButton({ title, className = "" }: Props) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    try {
      setUrl(window.location.href);
    } catch {
      setUrl("");
    }
  }, []);

  const share = async () => {
    const shareData = { title: title || "Inkura", url };
    const nav: any = typeof navigator !== "undefined" ? navigator : null;
    if (nav?.share && url) {
      try {
        await nav.share(shareData);
        return;
      } catch {
        // ignore and fallback to clipboard
      }
    }
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      className={`inline-flex items-center justify-center gap-2 rounded-full border border-gray-300 px-5 py-2 text-sm font-semibold leading-none hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 ${className}`.trim()}
      aria-label="Share"
    >
      {copied ? <Link2 size={20} className="h-5 w-5 shrink-0" /> : <Share2 size={20} className="h-5 w-5 shrink-0" />}
      <span className="whitespace-nowrap">{copied ? "Copied" : "Share"}</span>
    </button>
  );
}

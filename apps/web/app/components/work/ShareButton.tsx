"use client";

import { useEffect, useState } from "react";
import { Share2, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ShareButton({ title, className }: { title: string; className?: string }) {
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

    // Prefer native share on mobile.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nav: any = typeof navigator !== "undefined" ? navigator : null;
    if (nav?.share && url) {
      try {
        await nav.share(shareData);
        return;
      } catch {
        // user canceled or not supported → fallback copy
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
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold border border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800",
        className,
      )}
      aria-label="Share"
    >
      {copied ? <Link2 size={18} /> : <Share2 size={18} />}
      <span className="whitespace-nowrap">{copied ? "Copied" : "Share"}</span>
    </button>
  );
}

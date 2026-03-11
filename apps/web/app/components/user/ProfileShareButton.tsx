"use client";

import * as React from "react";
import { Share2 } from "lucide-react";

type Props = {
  path?: string;
  title?: string;
  className?: string;
  iconOnlyOnMobile?: boolean;
};

function absoluteUrl(path: string) {
  if (typeof window === "undefined") return path;
  if (/^https?:\/\//i.test(path)) return path;
  return new URL(path, window.location.origin).toString();
}

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

export default function ProfileShareButton({
  path = "/profile",
  title = "Inkura profile",
  className = "",
  iconOnlyOnMobile = false,
}: Props) {
  const [label, setLabel] = React.useState("Share Profile");

  React.useEffect(() => {
    if (label === "Share Profile") return;
    const timer = window.setTimeout(() => setLabel("Share Profile"), 1800);
    return () => window.clearTimeout(timer);
  }, [label]);

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={async () => {
        const url = absoluteUrl(path);
        const nav = navigator as Navigator & { share?: (data: { title?: string; url?: string }) => Promise<void> };
        try {
          if (typeof nav.share === "function") {
            await nav.share({ title, url });
            setLabel("Shared");
            return;
          }
          const copied = await copyText(url);
          setLabel(copied ? "Copied" : "Copy failed");
          if (!copied) window.prompt("Copy profile URL", url);
        } catch {
          const copied = await copyText(url);
          setLabel(copied ? "Copied" : "Copy failed");
        }
      }}
      className={className}
    >
      <Share2 className="h-4 w-4 shrink-0" aria-hidden="true" />
      {iconOnlyOnMobile ? <span className="sr-only md:not-sr-only md:ml-2">{label}</span> : <span className="ml-2">{label}</span>}
    </button>
  );
}

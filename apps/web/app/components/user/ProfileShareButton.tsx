"use client";

import * as React from "react";

type Props = {
  path?: string;
  title?: string;
  className?: string;
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

export default function ProfileShareButton({ path = "/profile", title = "Inkura profile", className = "" }: Props) {
  const [label, setLabel] = React.useState("Share Profile");

  React.useEffect(() => {
    if (label === "Share Profile") return;
    const timer = window.setTimeout(() => setLabel("Share Profile"), 1800);
    return () => window.clearTimeout(timer);
  }, [label]);

  return (
    <button
      type="button"
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
      {label}
    </button>
  );
}

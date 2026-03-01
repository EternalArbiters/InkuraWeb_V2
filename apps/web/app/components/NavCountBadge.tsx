"use client";

import * as React from "react";

function fmt(n: number) {
  if (n > 99) return "99+";
  return String(n);
}

export default function NavCountBadge({
  endpoint,
  className,
  variant = "absolute",
}: {
  endpoint: string;
  className?: string;
  variant?: "absolute" | "inline";
}) {
  const [count, setCount] = React.useState<number>(0);

  React.useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const res = await fetch(endpoint, { cache: "no-store" as any });
        const json = await res.json().catch(() => ({} as any));
        const c = Number(json?.count || 0);
        if (!mounted) return;
        setCount(Number.isFinite(c) ? c : 0);
      } catch {
        if (mounted) setCount(0);
      }
    }

    load();
    const t = setInterval(load, 30_000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, [endpoint]);

  if (!count) return null;

  const base =
    variant === "inline"
      ? "min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-extrabold flex items-center justify-center"
      : "absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-extrabold flex items-center justify-center";

  return (
    <span className={base + " " + (className || "")} aria-label={`${count} unread`} title={`${count} unread`}>
      {fmt(count)}
    </span>
  );
}

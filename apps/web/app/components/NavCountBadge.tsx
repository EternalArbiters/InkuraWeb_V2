"use client";

import * as React from "react";
import { NAV_BADGE_REFRESH_EVENT } from "./navBadgeEvents";

const VISIBLE_POLL_MS = 90_000;

type NavBadgeRefreshDetail = {
  endpoint?: string;
};

function fmt(n: number) {
  if (n > 99) return "99+";
  return String(n);
}

function isDocumentVisible() {
  if (typeof document === "undefined") return true;
  return document.visibilityState === "visible";
}

function isNavigatorOnline() {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine !== false;
}

export default function NavCountBadge({
  endpoint,
  className,
  variant = "absolute",
  enabled = true,
}: {
  endpoint: string;
  className?: string;
  variant?: "absolute" | "inline";
  enabled?: boolean;
}) {
  const [count, setCount] = React.useState<number>(0);

  React.useEffect(() => {
    if (!enabled) {
      setCount(0);
      return;
    }

    let mounted = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function load() {
      if (!mounted) return;
      if (!isDocumentVisible() || !isNavigatorOnline()) return;

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

    function clearTimer() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    }

    function schedule(delay = VISIBLE_POLL_MS) {
      clearTimer();
      if (!mounted) return;
      if (!isDocumentVisible()) return;
      timer = setTimeout(async () => {
        await load();
        schedule(VISIBLE_POLL_MS);
      }, delay);
    }

    function refreshNow() {
      void load();
      schedule(VISIBLE_POLL_MS);
    }

    function onVisibilityChange() {
      if (isDocumentVisible()) {
        refreshNow();
      } else {
        clearTimer();
      }
    }

    function onExternalRefresh(event: Event) {
      const detail = (event as CustomEvent<NavBadgeRefreshDetail>).detail;
      if (detail?.endpoint && detail.endpoint !== endpoint) return;
      refreshNow();
    }

    refreshNow();
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", refreshNow);
    window.addEventListener("online", refreshNow);
    window.addEventListener(NAV_BADGE_REFRESH_EVENT, onExternalRefresh as EventListener);

    return () => {
      mounted = false;
      clearTimer();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", refreshNow);
      window.removeEventListener("online", refreshNow);
      window.removeEventListener(NAV_BADGE_REFRESH_EVENT, onExternalRefresh as EventListener);
    };
  }, [enabled, endpoint]);

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

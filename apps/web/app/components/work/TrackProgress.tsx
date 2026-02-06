"use client";

import { useEffect } from "react";

export default function TrackProgress({
  workId,
  chapterId,
}: {
  workId: string;
  chapterId: string;
}) {
  useEffect(() => {
    let cancelled = false;
    let lastSentAt = 0;
    let lastProgress = -1;
    let raf = 0;

    const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

    const calcProgress = () => {
      const doc = document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop || 0;
      const max = (doc.scrollHeight || 0) - window.innerHeight;
      if (max <= 0) return 1;
      return clamp01(scrollTop / max);
    };

    const postProgress = async (progress: number) => {
      try {
        const res = await fetch("/api/progress", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ workId, chapterId, progress }),
          // allow send during page navigation
          keepalive: true,
        } as any);
        if (cancelled) return;
        await res.json().catch(() => null);
      } catch {
        // ignore
      }
    };

    const maybeSend = (force = false) => {
      const p = calcProgress();
      const now = Date.now();
      const timeOk = now - lastSentAt >= 2000;
      const deltaOk = Math.abs(p - lastProgress) >= 0.03;
      if (force || timeOk || deltaOk) {
        lastSentAt = now;
        lastProgress = p;
        void postProgress(p);
      }
    };

    // Initial progress
    maybeSend(true);

    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        if (cancelled) return;
        maybeSend(false);
      });
    };

    const onPageHide = () => {
      const p = calcProgress();
      const payload = JSON.stringify({ workId, chapterId, progress: p });
      try {
        if (navigator.sendBeacon) {
          const blob = new Blob([payload], { type: "application/json" });
          navigator.sendBeacon("/api/progress", blob);
        } else {
          void fetch("/api/progress", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: payload,
            keepalive: true,
          } as any);
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      cancelled = true;
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll as any);
      window.removeEventListener("resize", onScroll as any);
      window.removeEventListener("pagehide", onPageHide as any);
    };
  }, [workId, chapterId]);

  return null;
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useIsInkuraApp } from "@/hooks/useIsInkuraApp";

// v37: pull-down-to-refresh, like Chrome's. Scoped to the APK only — a normal
// mobile browser (Project 1/2, or this same site opened in Chrome/Safari) already
// has this built into the browser chrome itself; adding a second one at the page
// level there would just mean the gesture fires twice. The APK's bare WebView has
// no such browser chrome, so it needs this explicitly.
const PULL_THRESHOLD = 72; // px of drag before releasing triggers a refresh
const MAX_PULL = 110; // px — resistance caps the visible pull past this

export default function PullToRefresh() {
  const isApp = useIsInkuraApp();
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const tracking = useRef(false);

  useEffect(() => {
    if (!isApp) return;

    const onTouchStart = (e: TouchEvent) => {
      // Only ever start a pull from the very top of the page, same as Chrome.
      if (window.scrollY > 0 || refreshing) return;
      startY.current = e.touches[0].clientY;
      tracking.current = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!tracking.current || startY.current === null) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta <= 0) {
        // Scrolled back up past the start point, or not actually pulling down —
        // let the browser handle normal scrolling instead of hijacking it.
        setPull(0);
        return;
      }
      // Resistance curve so it doesn't track the finger 1:1 the further you pull —
      // same "gets harder to pull" feel as the native gesture.
      const eased = Math.min(MAX_PULL, delta * 0.45);
      setPull(eased);
      // Prevent the page itself from scrolling while a pull is in progress.
      if (e.cancelable) e.preventDefault();
    };

    const onTouchEnd = () => {
      if (!tracking.current) return;
      tracking.current = false;
      startY.current = null;
      if (pull >= PULL_THRESHOLD) {
        setRefreshing(true);
        // Matches what pulling to refresh does in a normal browser tab — a full
        // reload, not a soft client-side re-fetch, so it's never left showing
        // stale data after a deploy.
        window.location.reload();
      } else {
        setPull(0);
      }
    };

    // passive: false is required so preventDefault() in onTouchMove actually
    // suppresses the native scroll/overscroll-glow while dragging.
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApp, refreshing, pull]);

  if (!isApp || (pull === 0 && !refreshing)) return null;

  const progress = Math.min(1, pull / PULL_THRESHOLD);

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 2147483646,
        transform: `translateY(${refreshing ? 18 : pull - 36}px)`,
        transition: tracking.current ? "none" : "transform 0.2s ease-out",
        opacity: refreshing ? 1 : progress,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "#15214e",
          border: "1px solid #233c7e",
          boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: "50%",
            border: "2px solid #4574d3",
            borderTopColor: "transparent",
            transform: refreshing ? undefined : `rotate(${progress * 360}deg)`,
            animation: refreshing ? "hohoo-ptr-spin 0.7s linear infinite" : undefined,
          }}
        />
      </div>
      <style>{`@keyframes hohoo-ptr-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

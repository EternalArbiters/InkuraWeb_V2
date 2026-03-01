"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, LayoutGrid, MessageCircle } from "lucide-react";
import ChapterLikeButton from "@/app/components/work/ChapterLikeButton";

function isInteractiveTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return !!el.closest("a,button,input,textarea,select,label,summary,[role='button']");
}

export default function ReaderChrome({
  workId,
  workSlug,
  workTitle,
  chapterTitle,
  chapterId,
  prevId,
  nextId,
  initialLiked,
  initialLikeCount,
  children,
}: {
  workId: string;
  workSlug: string;
  workTitle: string;
  chapterTitle: string;
  chapterId: string;
  prevId: string | null;
  nextId: string | null;
  initialLiked: boolean;
  initialLikeCount: number;
  children: ReactNode;
}) {
  const [visible, setVisible] = useState(false);

  // Reading history / progress
  useEffect(() => {
    if (!workId || !chapterId) return;
    // Best-effort; ignore errors (401 for guests).
    fetch(`/api/progress`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ workId, chapterId, progress: 0 }),
    }).catch(() => null);
  }, [workId, chapterId]);

  const hrefPrev = useMemo(() => (prevId ? `/w/${workSlug}/read/${prevId}` : null), [prevId, workSlug]);
  const hrefNext = useMemo(() => (nextId ? `/w/${workSlug}/read/${nextId}` : null), [nextId, workSlug]);
  const hrefMenu = useMemo(() => `/w/${workSlug}`, [workSlug]);
  const hrefComments = useMemo(() => `/w/${workSlug}/read/${chapterId}/comments`, [workSlug, chapterId]);

  const toggle = useCallback((e: React.MouseEvent) => {
    // Desktop: no tap-to-toggle chrome.
    if (typeof window !== "undefined" && window.innerWidth >= 1024) return;
    if (isInteractiveTarget(e.target)) return;
    setVisible((v) => !v);
  }, []);

  return (
    <div className="relative" onClick={toggle}>
      {/* Mobile-only chrome (tap-to-toggle) */}
      <div
        className={`fixed inset-x-0 top-0 z-50 lg:hidden transition-all duration-200 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
      >
        <div className="bg-white/85 dark:bg-gray-950/75 backdrop-blur border-b border-gray-200 dark:border-gray-800">
          <div className="px-4 py-3">
            <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 truncate">{workTitle}</div>
            <div className="text-sm font-extrabold tracking-tight truncate">{chapterTitle}</div>
          </div>
        </div>
      </div>

      <div
        className={`fixed inset-x-0 bottom-0 z-50 lg:hidden transition-all duration-200 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
        }`}
      >
        <div className="bg-white/85 dark:bg-gray-950/75 backdrop-blur border-t border-gray-200 dark:border-gray-800">
          <div className="px-4 py-2">
            <div className="flex items-center justify-between gap-2">
              {hrefPrev ? (
                <Link
                  href={hrefPrev}
                  className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Previous"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Link>
              ) : (
                <span className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-gray-200 dark:border-gray-800 opacity-40">
                  <ChevronLeft className="w-5 h-5" />
                </span>
              )}

              <Link
                href={hrefMenu}
                className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
                onClick={(e) => e.stopPropagation()}
                aria-label="Menu"
              >
                <LayoutGrid className="w-5 h-5" />
              </Link>

              {hrefNext ? (
                <Link
                  href={hrefNext}
                  className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Next"
                >
                  <ChevronRight className="w-5 h-5" />
                </Link>
              ) : (
                <span className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-gray-200 dark:border-gray-800 opacity-40">
                  <ChevronRight className="w-5 h-5" />
                </span>
              )}

              <div onClick={(e) => e.stopPropagation()}>
                <ChapterLikeButton chapterId={chapterId} initialLiked={initialLiked} initialCount={initialLikeCount} variant="icon" />
              </div>

              <Link
                href={hrefComments}
                className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
                onClick={(e) => e.stopPropagation()}
                aria-label="Comments"
              >
                <MessageCircle className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Reader content */}
      <div className="relative">{children}</div>
    </div>
  );
}

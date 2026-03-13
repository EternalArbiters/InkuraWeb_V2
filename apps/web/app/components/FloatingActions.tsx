"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";
import { readChapterInteraction, seedChapterInteraction, subscribeChapterInteraction, updateChapterInteraction } from "@/lib/chapterInteractionStore";

function CircleButton({
  children,
  onClick,
  href,
  ariaLabel,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  ariaLabel: string;
  className?: string;
}) {
  const base =
    "inline-grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg ring-1 ring-white/10 " +
    "transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400";

  const inner = <span className="text-white">{children}</span>;

  if (href) {
    return (
      <Link href={href} aria-label={ariaLabel} className={`${base} ${className}`}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" aria-label={ariaLabel} onClick={onClick} className={`${base} ${className}`}>
      {inner}
    </button>
  );
}

function ArrowUpIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M12 5l-7 7m7-7l7 7M12 5v14"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HeartChatIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M12 21s-7-4.35-9.33-8.4C.8 9.2 2.55 6 6.08 6c1.87 0 3.13 1.03 3.92 2.1C10.79 7.03 12.05 6 13.92 6c3.53 0 5.28 3.2 3.41 6.6C19 16.65 12 21 12 21z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M9.4 13.2h5.2M9.4 15.4h3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill={filled ? "currentColor" : "none"} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M12 21s-7-4.35-9.33-8.4C.8 9.2 2.55 6 6.08 6c1.87 0 3.13 1.03 3.92 2.1C10.79 7.03 12.05 6 13.92 6c3.53 0 5.28 3.2 3.41 6.6C19 16.65 12 21 12 21z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function extractChapterId(pathname: string | null): string | null {
  if (!pathname) return null;
  const m = pathname.match(/\/read\/([^/?#]+)(?:\/|$)/);
  return m?.[1] ? decodeURIComponent(m[1]) : null;
}

function readReaderFloatingSeed(chapterId: string | null) {
  if (!chapterId || typeof document === "undefined") return null;
  const el = document.getElementById("reader-floating-seed");
  if (!(el instanceof HTMLElement)) return null;
  if (el.dataset.chapterId !== chapterId) return null;

  const likeCount = Number(el.dataset.likeCount || 0);
  return {
    liked: el.dataset.liked === "1",
    count: Number.isFinite(likeCount) ? likeCount : 0,
  };
}

export default function FloatingActions() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useUILanguageText("Shared Floating Actions");

  const isReader = useMemo(() => {
    if (!pathname) return false;
    return pathname.includes("/read/") || pathname.startsWith("/read/");
  }, [pathname]);

  const showChat = useMemo(() => {
    if (!pathname) return true;
    if (pathname.startsWith("/admin")) return false;
    if (pathname.startsWith("/auth")) return false;
    if (pathname === "/chat") return false;
    return true;
  }, [pathname]);

  const hideScrollTop = useMemo(() => {
    if (!pathname) return false;
    return pathname === "/chat" || pathname.startsWith("/chat/");
  }, [pathname]);

  const chapterId = useMemo(() => (isReader ? extractChapterId(pathname) : null), [isReader, pathname]);

  const [isPending, startTransition] = useTransition();
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);
  const [readerChromeVisible, setReaderChromeVisible] = useState(false);

  useEffect(() => {
    if (!chapterId) return;

    const sync = () => {
      const state = readChapterInteraction(chapterId);
      setLiked(state.liked ?? false);
      setCount(state.likeCount ?? 0);
    };

    const seeded = readReaderFloatingSeed(chapterId);
    if (seeded) {
      seedChapterInteraction(chapterId, { liked: seeded.liked, likeCount: seeded.count });
    }

    sync();
    const unsubscribe = subscribeChapterInteraction(chapterId, sync);

    if (!seeded) {
      let canceled = false;
      (async () => {
        const res = await fetch(`/api/chapters/${chapterId}`);
        if (!res.ok) return;
        const data = await res.json().catch(() => null as any);
        if (!data?.chapter || canceled) return;
        seedChapterInteraction(chapterId, {
          liked: !!data.chapter.viewerLiked,
          likeCount: typeof data.chapter.likeCount === "number" ? data.chapter.likeCount : 0,
        });
      })();
      return () => {
        canceled = true;
        unsubscribe();
      };
    }

    return unsubscribe;
  }, [chapterId]);

  useEffect(() => {
    if (!isReader || typeof window === "undefined") {
      setReaderChromeVisible(false);
      return;
    }

    const syncFromDom = () => {
      setReaderChromeVisible(document.documentElement.dataset.readerChromeVisible === "1");
    };

    const onVisibilityChange = (event: Event) => {
      const custom = event as CustomEvent<{ visible?: boolean }>;
      setReaderChromeVisible(!!custom.detail?.visible);
    };

    syncFromDom();
    window.addEventListener("inkura:reader-chrome-visibility", onVisibilityChange as EventListener);
    return () => {
      window.removeEventListener("inkura:reader-chrome-visibility", onVisibilityChange as EventListener);
    };
  }, [isReader, pathname]);

  const toggleChapterLike = () => {
    if (!chapterId) return;
    startTransition(async () => {
      const res = await fetch(`/api/chapters/${chapterId}/like`, { method: "POST" });
      if (res.status === 401) {
        router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname || "/")}`);
        return;
      }
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) return;
      updateChapterInteraction(chapterId, (current) => ({
        ...current,
        liked: !!data.liked,
        likeCount: typeof data.likeCount === "number" ? data.likeCount : current.likeCount ?? count,
      }));
    });
  };

  const shouldHideScrollTop = hideScrollTop || (isReader && readerChromeVisible);
  const opacityClass = isReader ? "opacity-50 hover:opacity-85" : "opacity-95 hover:opacity-100";
  const containerClass = isReader
    ? "fixed bottom-6 right-6 z-[80] flex flex-col items-end gap-3 md:bottom-24"
    : "fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-3";

  return (
    <div className={containerClass}>
      {!shouldHideScrollTop ? (
        <CircleButton ariaLabel={t("Scroll to top")} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className={opacityClass}>
          <ArrowUpIcon />
        </CircleButton>
      ) : null}

      {showChat && !isReader ? (
        <div className="hidden md:block">
          <CircleButton ariaLabel={t("Chat Elya")} href="/chat" className={opacityClass}>
            <HeartChatIcon />
          </CircleButton>
        </div>
      ) : null}

      {isReader && chapterId ? (
        <div className="hidden md:block">
          <CircleButton
            ariaLabel={liked ? `${t("Liked")} (${count})` : `${t("Like chapter")} (${count})`}
            onClick={toggleChapterLike}
            className={`${opacityClass} ${isPending ? "pointer-events-none opacity-40" : ""}`}
          >
            <span className="relative inline-flex items-center justify-center">
              <HeartIcon filled={liked} />
              <span className="absolute -bottom-2 -right-3 text-[10px] font-extrabold">{count}</span>
            </span>
          </CircleButton>
        </div>
      ) : null}
    </div>
  );
}

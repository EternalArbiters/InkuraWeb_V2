"use client";

import * as React from "react";
import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";
import {
  DEFAULT_NOVEL_READER_PREFERENCES,
  NOVEL_READER_PREFERENCES_EVENT,
  NOVEL_READER_PREFERENCES_KEY,
  getNovelReaderFontFamilyValue,
  type NovelReaderLineSpacing,
  type NovelReaderPreferences,
  type NovelReaderTheme,
  loadNovelReaderPreferences,
} from "@/app/components/reader/novelReaderPreferences";

type ProtectedNovelContentProps = {
  html: string;
  slideEndingContent?: React.ReactNode;
};

type HtmlBlock = {
  html: string;
  text: string;
  tag: string;
};

const MIN_SWIPE_PX = 140;
const SWIPE_WIDTH_RATIO = 0.22;

function preventDefault(event: Event) {
  event.preventDefault();
}

function preventReactDefault(event: React.SyntheticEvent) {
  event.preventDefault();
}

function shouldBlockShortcut(event: KeyboardEvent | React.KeyboardEvent<HTMLElement>) {
  if (!(event.ctrlKey || event.metaKey)) return false;
  const key = event.key.toLowerCase();
  return key === "c" || key === "x" || key === "a" || key === "s" || key === "u" || key === "p";
}

function handleReactKeyDown(event: React.KeyboardEvent<HTMLElement>) {
  if (shouldBlockShortcut(event)) {
    event.preventDefault();
  }
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return !!el.closest("a,button,input,textarea,select,label,summary,[role='button']");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function splitTextIntoHtmlChunks(text: string, maxChunkLength: number) {
  const normalized = String(text || "").replace(/\r\n?/g, "\n").trim();
  if (!normalized) return [] as string[];
  if (normalized.length <= maxChunkLength) {
    return [`<p>${escapeHtml(normalized).replace(/\n/g, "<br>")}</p>`];
  }

  const words = normalized.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChunkLength && current) {
      chunks.push(`<p>${escapeHtml(current)}</p>`);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) chunks.push(`<p>${escapeHtml(current)}</p>`);
  return chunks;
}

function extractBlocks(html: string): HtmlBlock[] {
  if (typeof window === "undefined") {
    return [{ html, text: normalizeWhitespace(html.replace(/<[^>]+>/g, " ")), tag: "div" }];
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div id="inkura-root">${html}</div>`, "text/html");
  const root = doc.getElementById("inkura-root");
  if (!root) return [];

  const blocks: HtmlBlock[] = [];
  for (const node of Array.from(root.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = normalizeWhitespace(node.textContent || "");
      if (!text) continue;
      blocks.push({ html: `<p>${escapeHtml(text)}</p>`, text, tag: "p" });
      continue;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) continue;
    const el = node as HTMLElement;
    const text = normalizeWhitespace(el.textContent || "");
    const htmlValue = el.outerHTML || "";
    if (!htmlValue.trim()) continue;
    blocks.push({ html: htmlValue, text, tag: el.tagName.toLowerCase() || "div" });
  }

  if (!blocks.length) {
    const text = normalizeWhitespace(root.textContent || "");
    if (text) blocks.push({ html: `<p>${escapeHtml(text)}</p>`, text, tag: "p" });
  }

  return blocks;
}

function lineHeightValue(lineSpacing: NovelReaderLineSpacing) {
  return lineSpacing === "airy" ? 2.15 : 1.95;
}

function pageBudgetFromViewport(width: number, height: number, fontScale: number, lineSpacing: NovelReaderLineSpacing) {
  const safeWidth = Math.max(width, 320);
  const safeHeight = Math.max(height, 360);
  const baseBudget = Math.max(450, Math.floor((safeWidth / 9) * (safeHeight / 30)));
  const fontPenalty = 1 / Math.max(fontScale, 0.9);
  const linePenalty = lineSpacing === "airy" ? 0.9 : 1;
  return Math.max(340, Math.floor(baseBudget * fontPenalty * linePenalty));
}

function buildPages(html: string, width: number, height: number, fontScale: number, lineSpacing: NovelReaderLineSpacing) {
  const budget = pageBudgetFromViewport(width, height, fontScale, lineSpacing);
  const blocks = extractBlocks(html).flatMap((block) => {
    const textLength = block.text.length;
    const splittable = block.tag === "p" || block.tag === "div" || block.tag === "blockquote" || block.tag === "li";
    if (!splittable || textLength <= Math.round(budget * 0.9)) {
      return [block];
    }

    return splitTextIntoHtmlChunks(block.text, Math.max(250, Math.floor(budget * 0.72))).map((chunkHtml) => ({
      html: chunkHtml,
      text: normalizeWhitespace(chunkHtml.replace(/<[^>]+>/g, " ")),
      tag: "p",
    }));
  });

  const pages: string[] = [];
  let currentHtml: string[] = [];
  let currentBudget = 0;

  for (const block of blocks) {
    const cost = Math.max(80, Math.min(block.text.length || 80, budget));
    if (currentHtml.length > 0 && currentBudget + cost > budget) {
      pages.push(currentHtml.join(""));
      currentHtml = [block.html];
      currentBudget = cost;
      continue;
    }

    currentHtml.push(block.html);
    currentBudget += cost;
  }

  if (currentHtml.length > 0) pages.push(currentHtml.join(""));
  if (!pages.length) pages.push(html);

  return pages;
}

function getReaderSurfaceClasses(theme: NovelReaderTheme) {
  switch (theme) {
    case "paper":
      return "bg-[#f7f5ef] text-slate-900";
    case "sepia":
      return "bg-[#efe3cb] text-[#37291b]";
    case "mist":
      return "bg-[#e7edf5] text-[#142033]";
    case "forest":
      return "bg-[#0f1a16] text-[#e4efe8]";
    case "rose":
      return "bg-[#f5e8e8] text-[#2c1f26]";
    case "midnight":
    default:
      return "bg-[#030917] text-slate-100";
  }
}

export default function ProtectedNovelContent({ html, slideEndingContent }: ProtectedNovelContentProps) {
  const t = useUILanguageText("Page Reader");
  const [preferences, setPreferences] = React.useState<NovelReaderPreferences>(DEFAULT_NOVEL_READER_PREFERENCES);
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageDirection, setPageDirection] = React.useState<"next" | "prev" | null>(null);
  const [viewport, setViewport] = React.useState({ width: 0, height: 0 });
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const touchStartX = React.useRef<number | null>(null);
  const touchStartY = React.useRef<number | null>(null);

  const pages = React.useMemo(
    () => buildPages(html, viewport.width, viewport.height, preferences.fontScale, preferences.lineSpacing),
    [html, preferences.fontScale, preferences.lineSpacing, viewport.height, viewport.width]
  );
  const isMobileViewport = viewport.width > 0 ? viewport.width < 1024 : true;
  const showSlideEndingPage = preferences.mode === "slide" && isMobileViewport && !!slideEndingContent;
  const totalPages = pages.length + (showSlideEndingPage ? 1 : 0);
  const clampedPageIndex = Math.min(pageIndex, Math.max(0, totalPages - 1));
  const isEndingPage = showSlideEndingPage && clampedPageIndex === pages.length;
  const currentPage = isEndingPage ? "" : pages[Math.min(clampedPageIndex, Math.max(0, pages.length - 1))] || html;
  const lineHeight = lineHeightValue(preferences.lineSpacing);
  const fontSize = `${preferences.fontScale}rem`;
  const fontFamily = getNovelReaderFontFamilyValue(preferences.fontFamily);
  const surfaceClassName = getReaderSurfaceClasses(preferences.theme);

  React.useEffect(() => {
    const options = { capture: true } as AddEventListenerOptions;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (shouldBlockShortcut(event)) {
        event.preventDefault();
        return;
      }

      if (preferences.mode !== "slide") return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setPageDirection("next");
        setPageIndex((current) => Math.min(totalPages - 1, current + 1));
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setPageDirection("prev");
        setPageIndex((current) => Math.max(0, current - 1));
      }
    };

    document.addEventListener("copy", preventDefault, options);
    document.addEventListener("cut", preventDefault, options);
    document.addEventListener("contextmenu", preventDefault, options);
    document.addEventListener("dragstart", preventDefault, options);
    document.addEventListener("selectstart", preventDefault, options);
    document.addEventListener("keydown", handleKeyDown, options);

    return () => {
      document.removeEventListener("copy", preventDefault, options);
      document.removeEventListener("cut", preventDefault, options);
      document.removeEventListener("contextmenu", preventDefault, options);
      document.removeEventListener("dragstart", preventDefault, options);
      document.removeEventListener("selectstart", preventDefault, options);
      document.removeEventListener("keydown", handleKeyDown, options);
    };
  }, [preferences.mode, totalPages]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    setPreferences(loadNovelReaderPreferences());

    const syncPreferences = () => setPreferences(loadNovelReaderPreferences());
    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === NOVEL_READER_PREFERENCES_KEY) syncPreferences();
    };

    window.addEventListener(NOVEL_READER_PREFERENCES_EVENT, syncPreferences as EventListener);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(NOVEL_READER_PREFERENCES_EVENT, syncPreferences as EventListener);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const updateViewport = () => {
      const topOffset = wrapperRef.current?.getBoundingClientRect().top ?? 0;
      const width = wrapperRef.current?.clientWidth ?? window.innerWidth;
      const height = Math.max(360, Math.floor(window.innerHeight - Math.max(topOffset, 0) - 24));
      setViewport({ width, height });
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    window.addEventListener("orientationchange", updateViewport);
    return () => {
      window.removeEventListener("resize", updateViewport);
      window.removeEventListener("orientationchange", updateViewport);
    };
  }, []);

  React.useEffect(() => {
    setPageIndex((current) => Math.min(current, Math.max(0, totalPages - 1)));
  }, [totalPages]);

  React.useEffect(() => {
    setPageIndex(0);
  }, [html, preferences.mode]);

  React.useEffect(() => {
    if (!pageDirection) return;
    const timer = window.setTimeout(() => setPageDirection(null), 360);
    return () => window.clearTimeout(timer);
  }, [pageDirection]);

  React.useEffect(() => {
    const node = wrapperRef.current;
    if (!node) return;

    const handleSelectStart = (event: Event) => event.preventDefault();
    node.addEventListener("selectstart", handleSelectStart);
    return () => node.removeEventListener("selectstart", handleSelectStart);
  }, []);

  const goPrev = React.useCallback(() => {
    setPageDirection("prev");
    setPageIndex((current) => Math.max(0, current - 1));
  }, []);

  const goNext = React.useCallback(() => {
    setPageDirection("next");
    setPageIndex((current) => Math.min(totalPages - 1, current + 1));
  }, [totalPages]);

  const onTouchStart = React.useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
    touchStartY.current = event.changedTouches[0]?.clientY ?? null;
  }, []);

  const onTouchEnd = React.useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      const endX = event.changedTouches[0]?.clientX ?? null;
      const endY = event.changedTouches[0]?.clientY ?? null;
      const startX = touchStartX.current;
      const startY = touchStartY.current;
      touchStartX.current = null;
      touchStartY.current = null;

      if (startX == null || startY == null || endX == null || endY == null) return;
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const requiredSwipe = Math.max(MIN_SWIPE_PX, Math.floor(viewport.width * SWIPE_WIDTH_RATIO));

      if (Math.abs(deltaX) < requiredSwipe) return;
      if (Math.abs(deltaX) < Math.abs(deltaY) * 1.6) return;

      if (deltaX < 0) {
        goNext();
        return;
      }
      goPrev();
    },
    [goNext, goPrev, viewport.width]
  );

  const onSlideClick = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (preferences.mode !== "slide") return;
      if (isInteractiveTarget(event.target)) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      const clickX = event.clientX - bounds.left;
      const leftZone = bounds.width * 0.32;
      const rightZone = bounds.width * 0.68;

      if (clickX <= leftZone) {
        event.stopPropagation();
        goPrev();
        return;
      }
      if (clickX >= rightZone) {
        event.stopPropagation();
        goNext();
      }
    },
    [goNext, goPrev, preferences.mode]
  );

  return (
    <div
      ref={wrapperRef}
      className="px-0"
      onCopy={preventReactDefault}
      onCut={preventReactDefault}
      onContextMenu={preventReactDefault}
      onDragStart={preventReactDefault}
      onKeyDown={handleReactKeyDown}
      aria-label={t("Novel reader content")}
    >
      <style jsx>{`
        @keyframes novelPageNext {
          0% { opacity: 0.2; transform: perspective(1600px) rotateY(-18deg) translateX(32px) scale(0.985); filter: brightness(0.9); }
          60% { opacity: 1; transform: perspective(1600px) rotateY(4deg) translateX(-6px) scale(1); }
          100% { opacity: 1; transform: perspective(1600px) rotateY(0deg) translateX(0) scale(1); filter: brightness(1); }
        }
        @keyframes novelPagePrev {
          0% { opacity: 0.2; transform: perspective(1600px) rotateY(18deg) translateX(-32px) scale(0.985); filter: brightness(0.9); }
          60% { opacity: 1; transform: perspective(1600px) rotateY(-4deg) translateX(6px) scale(1); }
          100% { opacity: 1; transform: perspective(1600px) rotateY(0deg) translateX(0) scale(1); filter: brightness(1); }
        }
        .novel-page-next { animation: novelPageNext 360ms cubic-bezier(.22,.8,.2,1); }
        .novel-page-prev { animation: novelPagePrev 360ms cubic-bezier(.22,.8,.2,1); }
        .novel-reader-surface {
          font-size: ${fontSize};
          line-height: ${lineHeight};
          font-family: ${fontFamily};
        }
        .novel-reader-surface p, .novel-reader-surface div { margin: 0 0 1rem; }
        .novel-reader-surface h1, .novel-reader-surface h2, .novel-reader-surface h3, .novel-reader-surface h4 { margin: 1.4rem 0 .8rem; font-weight: 700; line-height: 1.25; }
        .novel-reader-surface h1 { font-size: 1.75rem; }
        .novel-reader-surface h2 { font-size: 1.45rem; }
        .novel-reader-surface h3 { font-size: 1.2rem; }
        .novel-reader-surface ul, .novel-reader-surface ol { margin: 0 0 1rem 1.4rem; }
        .novel-reader-surface li { margin: .25rem 0; }
        .novel-reader-surface blockquote { margin: 1.2rem 0; border-left: 3px solid rgba(168,85,247,.75); padding-left: 1rem; opacity: .95; }
        .novel-reader-surface img { display: block; max-width: min(100%, 760px); height: auto; margin: 1.2rem auto; border-radius: 1rem; }
        .novel-reader-surface figure { margin: 1.2rem 0; }
        .novel-reader-surface table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
        .novel-reader-surface td, .novel-reader-surface th { border: 1px solid rgba(148,163,184,.25); padding: .55rem .7rem; }
        .novel-reader-surface pre, .novel-reader-surface code { white-space: pre-wrap; }
      `}</style>

      {preferences.mode === "scroll" ? (
        <article
          className={`novel-reader-surface min-h-[calc(100svh-180px)] max-w-none select-none px-5 py-6 sm:px-6 sm:py-7 lg:px-8 lg:py-8 [&_*]:select-none ${surfaceClassName}`}
          style={{
            WebkitTouchCallout: "none",
            WebkitUserSelect: "none",
            userSelect: "none",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </article>
      ) : (
        <div
          className="relative"
          aria-label={`${t("Page")} ${clampedPageIndex + 1} / ${totalPages}`}
        >
          <div
            className={`relative overflow-hidden ${surfaceClassName}`}
            style={{
              minHeight: viewport.height ? `${viewport.height}px` : "70svh",
              WebkitTouchCallout: "none",
              WebkitUserSelect: "none",
              userSelect: "none",
              WebkitTapHighlightColor: "transparent",
            }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onClick={onSlideClick}
          >
            {isEndingPage ? (
              <article
                className={`novel-reader-surface h-full overflow-y-auto px-5 py-6 select-none lg:px-8 lg:py-8 [&_*]:select-none ${
                  pageDirection === "next" ? "novel-page-next" : pageDirection === "prev" ? "novel-page-prev" : ""
                }`}
              >
                <div className="mx-auto max-w-3xl">{slideEndingContent}</div>
              </article>
            ) : (
              <article
                className={`novel-reader-surface h-full overflow-hidden px-5 py-6 select-none lg:px-8 lg:py-8 [&_*]:select-none ${
                  pageDirection === "next" ? "novel-page-next" : pageDirection === "prev" ? "novel-page-prev" : ""
                }`}
              >
                <div dangerouslySetInnerHTML={{ __html: currentPage }} />
              </article>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

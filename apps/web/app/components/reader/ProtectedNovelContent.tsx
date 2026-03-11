"use client";

import * as React from "react";

type ProtectedNovelContentProps = {
  html: string;
};

type ReaderMode = "scroll" | "slide";
type HtmlBlock = {
  html: string;
  text: string;
  tag: string;
};

const READER_MODE_KEY = "inkura:novel-reader-mode";

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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
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

function pageBudgetFromViewport(width: number, height: number) {
  const safeWidth = Math.max(width, 320);
  const safeHeight = Math.max(height, 360);
  return Math.max(450, Math.floor((safeWidth / 9) * (safeHeight / 30)));
}

function buildPages(html: string, width: number, height: number) {
  const budget = pageBudgetFromViewport(width, height);
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

function relativeTouchDelta(start: number | null, end: number | null) {
  if (start == null || end == null) return 0;
  return end - start;
}

export default function ProtectedNovelContent({ html }: ProtectedNovelContentProps) {
  const [mode, setMode] = React.useState<ReaderMode>("scroll");
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageDirection, setPageDirection] = React.useState<"next" | "prev" | null>(null);
  const [viewport, setViewport] = React.useState({ width: 0, height: 0 });
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const touchStartX = React.useRef<number | null>(null);

  const pages = React.useMemo(() => buildPages(html, viewport.width, viewport.height), [html, viewport.height, viewport.width]);
  const clampedPageIndex = Math.min(pageIndex, Math.max(0, pages.length - 1));

  React.useEffect(() => {
    const options = { capture: true } as AddEventListenerOptions;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (shouldBlockShortcut(event)) {
        event.preventDefault();
        return;
      }

      if (mode !== "slide") return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setPageDirection("next");
        setPageIndex((current) => Math.min(pages.length - 1, current + 1));
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
  }, [mode, pages.length]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(READER_MODE_KEY);
    if (saved === "scroll" || saved === "slide") {
      setMode(saved);
    }
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(READER_MODE_KEY, mode);
  }, [mode]);

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
    setPageIndex((current) => Math.min(current, Math.max(0, pages.length - 1)));
  }, [pages.length]);

  React.useEffect(() => {
    setPageIndex(0);
  }, [html]);

  React.useEffect(() => {
    if (!pageDirection) return;
    const timer = window.setTimeout(() => setPageDirection(null), 260);
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
    setPageIndex((current) => Math.min(pages.length - 1, current + 1));
  }, [pages.length]);

  const onTouchStart = React.useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  }, []);

  const onTouchEnd = React.useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    const deltaX = relativeTouchDelta(touchStartX.current, event.changedTouches[0]?.clientX ?? null);
    touchStartX.current = null;
    if (Math.abs(deltaX) < 48) return;
    if (deltaX < 0) {
      goNext();
      return;
    }
    goPrev();
  }, [goNext, goPrev]);

  const currentPage = pages[clampedPageIndex] || html;

  return (
    <div
      ref={wrapperRef}
      className="px-4 lg:px-0"
      onCopy={preventReactDefault}
      onCut={preventReactDefault}
      onContextMenu={preventReactDefault}
      onDragStart={preventReactDefault}
      onKeyDown={handleReactKeyDown}
      aria-label="Novel reader content"
    >
      <style jsx>{`
        @keyframes novelPageNext {
          0% { opacity: 0; transform: rotateY(-10deg) translateX(24px); transform-origin: left center; }
          100% { opacity: 1; transform: rotateY(0deg) translateX(0); transform-origin: left center; }
        }
        @keyframes novelPagePrev {
          0% { opacity: 0; transform: rotateY(10deg) translateX(-24px); transform-origin: right center; }
          100% { opacity: 1; transform: rotateY(0deg) translateX(0); transform-origin: right center; }
        }
        .novel-page-next { animation: novelPageNext 260ms ease; }
        .novel-page-prev { animation: novelPagePrev 260ms ease; }
      `}</style>

      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="inline-flex rounded-full border border-gray-200 bg-white/80 p-1 text-xs font-semibold text-gray-600 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/70 dark:text-gray-300">
          <button
            type="button"
            className={`rounded-full px-3 py-1.5 transition ${mode === "scroll" ? "bg-purple-600 text-white shadow" : "hover:text-gray-900 dark:hover:text-white"}`}
            onClick={() => setMode("scroll")}
          >
            Scroll
          </button>
          <button
            type="button"
            className={`rounded-full px-3 py-1.5 transition ${mode === "slide" ? "bg-purple-600 text-white shadow" : "hover:text-gray-900 dark:hover:text-white"}`}
            onClick={() => setMode("slide")}
          >
            Slide
          </button>
        </div>

        {mode === "slide" ? (
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            Page {clampedPageIndex + 1} / {pages.length}
          </div>
        ) : null}
      </div>

      {mode === "scroll" ? (
        <article
          className="prose prose-neutral dark:prose-invert max-w-none prose-p:leading-8 prose-li:leading-8 prose-headings:tracking-tight prose-img:rounded-2xl prose-img:mx-auto prose-figure:mx-0 prose-pre:whitespace-pre-wrap select-none [&_*]:select-none"
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
        <div className="space-y-4">
          <div
            className="relative overflow-hidden rounded-[28px] border border-gray-200 bg-white/85 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.65)] backdrop-blur dark:border-gray-800 dark:bg-gray-900/70"
            style={{
              minHeight: viewport.height ? `${viewport.height}px` : "70svh",
              WebkitTouchCallout: "none",
              WebkitUserSelect: "none",
              userSelect: "none",
              WebkitTapHighlightColor: "transparent",
            }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <article
              className={`prose prose-neutral dark:prose-invert max-w-none h-full overflow-hidden px-5 py-6 lg:px-8 lg:py-8 prose-p:leading-8 prose-li:leading-8 prose-headings:tracking-tight prose-img:rounded-2xl prose-img:mx-auto prose-figure:mx-0 prose-pre:whitespace-pre-wrap select-none [&_*]:select-none ${pageDirection === "next" ? "novel-page-next" : pageDirection === "prev" ? "novel-page-prev" : ""}`}
            >
              <div dangerouslySetInnerHTML={{ __html: currentPage }} />
            </article>
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-900"
              onClick={goPrev}
              disabled={clampedPageIndex <= 0}
            >
              Previous page
            </button>
            <div className="text-center text-xs font-medium text-gray-500 dark:text-gray-400">Swipe left/right to turn pages</div>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-900"
              onClick={goNext}
              disabled={clampedPageIndex >= pages.length - 1}
            >
              Next page
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import * as React from "react";

import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";

type ComicPage = {
  id: string;
  imageUrl: string;
  order?: number | null;
};

type ImageMeta = {
  width: number;
  height: number;
};

function PageSkeleton({ index, total, state }: { index: number; total: number; state: "loading" | "error" }) {
  return (
    <div
      className={[
        "pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-300",
        state === "error" ? "bg-gray-200/90 dark:bg-gray-900/95" : "bg-gray-200/80 dark:bg-gray-900/90",
      ].join(" ")}
      aria-hidden="true"
    >
      <div className="rounded-full bg-black/45 px-4 py-2 text-sm font-semibold tracking-wide text-white shadow-lg backdrop-blur-sm">
        {index + 1}/{total}
      </div>
    </div>
  );
}

function ComicPageItem({
  page,
  index,
  total,
}: {
  page: ComicPage;
  index: number;
  total: number;
}) {
  const t = useUILanguageText();
  const [state, setState] = React.useState<"loading" | "loaded" | "error">("loading");
  const [meta, setMeta] = React.useState<ImageMeta | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const imageRef = React.useRef<HTMLImageElement | null>(null);

  React.useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const handleSelectStart = (event: Event) => event.preventDefault();
    node.addEventListener("selectstart", handleSelectStart);
    return () => node.removeEventListener("selectstart", handleSelectStart);
  }, []);

  React.useEffect(() => {
    setState("loading");
    setMeta(null);

    const img = imageRef.current;
    if (!img) return;

    if (img.complete) {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        setMeta({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
        setState("loaded");
      } else {
        setState("error");
      }
    }
  }, [page.imageUrl]);

  const aspectRatio = meta && meta.width > 0 && meta.height > 0 ? `${meta.width} / ${meta.height}` : undefined;

  return (
    <div
      ref={containerRef}
      className="relative isolate overflow-hidden bg-gray-200 dark:bg-gray-900 select-none"
      style={{
        aspectRatio,
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
      }}
      onContextMenu={(event) => event.preventDefault()}
      onDragStart={(event) => event.preventDefault()}
      onCopy={(event) => event.preventDefault()}
      onCut={(event) => event.preventDefault()}
    >
      {state !== "loaded" ? <PageSkeleton index={index} total={total} state={state} /> : null}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imageRef}
        src={page.imageUrl}
        alt={`${t("Page")} ${typeof page.order === "number" ? page.order : index + 1}`}
        loading={index === 0 ? "eager" : "lazy"}
        fetchPriority={index === 0 ? "high" : "auto"}
        decoding="async"
        draggable={false}
        className={[
          "relative z-[1] block h-auto w-full transition-opacity duration-300",
          state === "error" ? "opacity-0" : "opacity-100",
        ].join(" ")}
        style={{
          WebkitTouchCallout: "none",
          WebkitUserSelect: "none",
          userSelect: "none",
          pointerEvents: "none",
        }}
        onLoad={(event) => {
          const target = event.currentTarget;
          setMeta({
            width: target.naturalWidth || 1,
            height: target.naturalHeight || 1,
          });
          setState("loaded");
        }}
        onError={() => setState("error")}
      />

      {/* Transparent shield so long-press targets the container instead of media. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-[2]"
        style={{ WebkitTouchCallout: "none", touchAction: "pan-y pinch-zoom" }}
        onContextMenu={(event) => event.preventDefault()}
        onDragStart={(event) => event.preventDefault()}
      />

      {state === "error" ? (
        <div className="absolute inset-x-0 bottom-4 z-[3] mx-auto w-fit rounded-full bg-red-600/85 px-3 py-1 text-xs font-semibold text-white shadow-lg">
          {t("Failed to load page")}
        </div>
      ) : null}
    </div>
  );
}

export default function ComicPageStack({ pages }: { pages: ComicPage[] }) {
  const total = pages.length;

  return (
    <div className="-mx-0 flex flex-col gap-0 sm:-mx-0 lg:mx-0">
      {pages.map((page, index) => (
        <ComicPageItem key={page.id} page={page} index={index} total={total} />
      ))}
    </div>
  );
}

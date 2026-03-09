"use client";

import * as React from "react";

type ComicPage = {
  id: string;
  imageUrl: string;
  order?: number | null;
};

function PageSkeleton({ index, total, state }: { index: number; total: number; state: "loading" | "error" }) {
  return (
    <div
      className={[
        "pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-500",
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
  const [state, setState] = React.useState<"loading" | "loaded" | "error">("loading");

  return (
    <div
      className="relative isolate overflow-hidden bg-gray-200 dark:bg-gray-900"
      style={{ minHeight: "42vh" }}
    >
      {state !== "loaded" ? <PageSkeleton index={index} total={total} state={state} /> : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={page.imageUrl}
        alt={`Page ${typeof page.order === "number" ? page.order : index + 1}`}
        loading={index <= 1 ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setState("loaded")}
        onError={() => setState("error")}
        className={[
          "relative z-[1] block w-full transition-opacity duration-500",
          state === "loaded" ? "opacity-100" : "opacity-0",
        ].join(" ")}
      />
      {state === "error" ? (
        <div className="absolute inset-x-0 bottom-4 z-[2] mx-auto w-fit rounded-full bg-red-600/85 px-3 py-1 text-xs font-semibold text-white shadow-lg">
          Gagal memuat halaman
        </div>
      ) : null}
    </div>
  );
}

export default function ComicPageStack({ pages }: { pages: ComicPage[] }) {
  const total = pages.length;

  return (
    <div className="-mx-0 sm:-mx-0 lg:mx-0 flex flex-col gap-0">
      {pages.map((page, index) => (
        <ComicPageItem key={page.id} page={page} index={index} total={total} />
      ))}
    </div>
  );
}

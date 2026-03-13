"use client";

import * as React from "react";
import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";

type Props = {
  children: React.ReactNode;
  className?: string;
  initialCount?: number;
  step?: number;
  buttonLabel?: string;
};

export default function LoadMoreList({
  children,
  className,
  initialCount = 30,
  step = 30,
  buttonLabel,
}: Props) {
  const t = useUILanguageText("Shared Floating Actions");
  const items = React.Children.toArray(children);
  const [visibleCount, setVisibleCount] = React.useState(initialCount);

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

  return (
    <>
      <div className={className}>{visibleItems}</div>
      {hasMore ? (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((current) => Math.min(current + step, items.length))}
            className="inline-flex items-center justify-center rounded-full border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-900"
          >
            {buttonLabel || t("Load more")}
          </button>
        </div>
      ) : null}
    </>
  );
}

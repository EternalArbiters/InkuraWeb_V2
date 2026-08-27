"use client";

import * as React from "react";
import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";

type TabKey = "info" | "chapter" | "review" | "comment";

// Source strings match existing catalog entries used elsewhere on this page
// (WorkInfoPanel's "Info", ReviewSection's "Reviews", CommentSection's
// "Comments") so this reuses their translations instead of adding new ones.
const TABS: { key: TabKey; sourceLabel: string }[] = [
  { key: "info", sourceLabel: "Info" },
  { key: "chapter", sourceLabel: "Chapter" },
  { key: "review", sourceLabel: "Reviews" },
  { key: "comment", sourceLabel: "Comments" },
];

// v30: mobile-only tab switcher for the work detail page — desktop keeps the
// existing stacked layout (rendered separately, hidden on mobile) unchanged.
// Content is passed in as already-rendered nodes so each section (description/
// info/series, chapters, reviews, comments) is still a single ordinary render
// of the same server-fetched data — this component only controls which one is
// shown.
export default function WorkDetailMobileTabs({
  infoContent,
  chapterContent,
  reviewContent,
  commentContent,
}: {
  infoContent: React.ReactNode;
  chapterContent: React.ReactNode;
  reviewContent: React.ReactNode;
  commentContent: React.ReactNode;
}) {
  const t = useUILanguageText();
  const [tab, setTab] = React.useState<TabKey>("info");

  return (
    <div className="mt-6 md:hidden">
      <div className="flex items-center gap-6 border-b border-black/10 dark:border-white/10">
        {TABS.map(({ key, sourceLabel }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`relative pb-3 text-sm font-bold transition ${
                active ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500"
              }`}
            >
              {t(sourceLabel)}
              {active ? <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-gray-900 dark:bg-white" /> : null}
            </button>
          );
        })}
      </div>

      <div className={tab === "info" ? "mt-4" : "hidden"}>{infoContent}</div>
      <div className={tab === "chapter" ? "mt-4" : "hidden"}>{chapterContent}</div>
      <div className={tab === "review" ? "mt-4" : "hidden"}>{reviewContent}</div>
      <div className={tab === "comment" ? "mt-4" : "hidden"}>{commentContent}</div>
    </div>
  );
}

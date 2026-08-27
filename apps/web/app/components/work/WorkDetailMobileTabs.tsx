"use client";

import * as React from "react";

type TabKey = "info" | "chapter" | "comment";

const TABS: { key: TabKey; label: string }[] = [
  { key: "info", label: "Info" },
  { key: "chapter", label: "Chapter" },
  { key: "comment", label: "Comment" },
];

// v30: mobile-only tab switcher for the work detail page — desktop keeps the
// existing stacked layout (rendered separately, hidden on mobile) unchanged.
// Content is passed in as already-rendered nodes so each section (description/
// info/series, chapters, comments) is still a single ordinary render of the
// same server-fetched data — this component only controls which one is shown.
export default function WorkDetailMobileTabs({
  infoContent,
  chapterContent,
  commentContent,
}: {
  infoContent: React.ReactNode;
  chapterContent: React.ReactNode;
  commentContent: React.ReactNode;
}) {
  const [tab, setTab] = React.useState<TabKey>("info");

  return (
    <div className="mt-6 md:hidden">
      <div className="flex items-center gap-6 border-b border-black/10 dark:border-white/10">
        {TABS.map(({ key, label }) => {
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
              {label}
              {active ? <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-gray-900 dark:bg-white" /> : null}
            </button>
          );
        })}
      </div>

      <div className={tab === "info" ? "mt-4" : "hidden"}>{infoContent}</div>
      <div className={tab === "chapter" ? "mt-4" : "hidden"}>{chapterContent}</div>
      <div className={tab === "comment" ? "mt-4" : "hidden"}>{commentContent}</div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { BookOpen, ChevronLeft, ChevronRight, LayoutGrid, MessageCircle, Settings2, Smartphone } from "lucide-react";
import ChapterLikeButton from "@/app/components/work/ChapterLikeButton";
import {
  DEFAULT_NOVEL_READER_PREFERENCES,
  NOVEL_READER_PREFERENCES_EVENT,
  NOVEL_READER_PREFERENCES_KEY,
  NovelReaderPreferences,
  loadNovelReaderPreferences,
  updateNovelReaderPreferences,
} from "@/app/components/reader/novelReaderPreferences";

const READ_CHAPTERS_STORAGE_PREFIX = "inkura:read-chapters:";

function getReadChaptersStorageKey(workSlug: string) {
  return `${READ_CHAPTERS_STORAGE_PREFIX}${workSlug}`;
}

function rememberReadChapter(workSlug: string, chapterId: string) {
  if (typeof window === "undefined" || !workSlug || !chapterId) return;
  const key = getReadChaptersStorageKey(workSlug);
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    const next = Array.isArray(parsed) ? parsed.filter((value) => typeof value === "string" && value) : [];
    if (!next.includes(chapterId)) next.push(chapterId);
    window.localStorage.setItem(key, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("inkura:read-chapters-updated", { detail: { workSlug } }));
  } catch {}
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return !!el.closest("a,button,input,textarea,select,label,summary,[role='button']");
}

const themeOptions: Array<{
  value: NovelReaderPreferences["theme"];
  label: string;
  helper: string;
  swatchClassName: string;
}> = [
  {
    value: "paper",
    label: "Paper",
    helper: "Bright and clean",
    swatchClassName: "border-slate-200 bg-white",
  },
  {
    value: "midnight",
    label: "Midnight",
    helper: "Easy on the eyes",
    swatchClassName: "border-[#17243d] bg-[#050b17]",
  },
  {
    value: "sepia",
    label: "Sepia",
    helper: "Warm book tone",
    swatchClassName: "border-[#d9c7a3] bg-[#efe3cb]",
  },
];

function SettingChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "inline-flex min-h-11 items-center justify-center rounded-2xl border px-3 text-sm font-semibold transition " +
        (active
          ? "border-purple-500 bg-purple-600 text-white shadow-[0_14px_30px_-20px_rgba(168,85,247,0.9)]"
          : "border-white/10 bg-white/5 text-slate-200 hover:border-white/20 hover:bg-white/10")
      }
    >
      {label}
    </button>
  );
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
  readerType = "COMIC",
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
  readerType?: "NOVEL" | "COMIC";
  children: ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [novelPreferences, setNovelPreferences] = useState<NovelReaderPreferences>(DEFAULT_NOVEL_READER_PREFERENCES);
  const showNovelControls = readerType === "NOVEL";

  // Reading history / progress
  useEffect(() => {
    if (!workId || !chapterId) return;
    rememberReadChapter(workSlug, chapterId);
    // Best-effort; ignore errors (401 for guests).
    fetch(`/api/progress`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ workId, chapterId, progress: 0 }),
    }).catch(() => null);
  }, [workId, chapterId, workSlug]);

  useEffect(() => {
    if (!showNovelControls || typeof window === "undefined") return;
    setNovelPreferences(loadNovelReaderPreferences());

    const syncPreferences = () => setNovelPreferences(loadNovelReaderPreferences());
    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === NOVEL_READER_PREFERENCES_KEY) syncPreferences();
    };

    window.addEventListener(NOVEL_READER_PREFERENCES_EVENT, syncPreferences as EventListener);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(NOVEL_READER_PREFERENCES_EVENT, syncPreferences as EventListener);
      window.removeEventListener("storage", handleStorage);
    };
  }, [showNovelControls]);

  useEffect(() => {
    if (!visible) setSettingsOpen(false);
  }, [visible]);

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

  const updatePreferences = useCallback((patch: Partial<NovelReaderPreferences>) => {
    const next = updateNovelReaderPreferences(patch);
    setNovelPreferences(next);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    root.dataset.readerChromeVisible = visible ? "1" : "0";
    window.dispatchEvent(new CustomEvent("inkura:reader-chrome-visibility", { detail: { visible } }));
    return () => {
      root.dataset.readerChromeVisible = "0";
      window.dispatchEvent(new CustomEvent("inkura:reader-chrome-visibility", { detail: { visible: false } }));
    };
  }, [visible]);

  return (
    <div className="relative" onClick={toggle}>
      {/* Mobile-only chrome (tap-to-toggle) */}
      <div
        className={`fixed inset-x-0 top-0 z-50 lg:hidden transition-all duration-200 ${
          visible ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
        }`}
      >
        <div className="border-b border-white/10 bg-[#030917]/90 text-white backdrop-blur-xl">
          <div className="px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-slate-300">{workTitle}</div>
                <div className="truncate text-sm font-extrabold tracking-tight text-white">{chapterTitle}</div>
              </div>

              {showNovelControls ? (
                <div className="flex shrink-0 items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className={
                      "inline-flex h-10 w-10 items-center justify-center rounded-full border transition " +
                      (novelPreferences.mode === "scroll"
                        ? "border-purple-400 bg-purple-600 text-white shadow-[0_12px_26px_-18px_rgba(168,85,247,0.9)]"
                        : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                    }
                    onClick={() => updatePreferences({ mode: "scroll" })}
                    aria-label="Scroll mode"
                    title="Scroll mode"
                  >
                    <Smartphone className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={
                      "inline-flex h-10 w-10 items-center justify-center rounded-full border transition " +
                      (novelPreferences.mode === "slide"
                        ? "border-purple-400 bg-purple-600 text-white shadow-[0_12px_26px_-18px_rgba(168,85,247,0.9)]"
                        : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                    }
                    onClick={() => updatePreferences({ mode: "slide" })}
                    aria-label="Slide mode"
                    title="Slide mode"
                  >
                    <BookOpen className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={
                      "inline-flex h-10 w-10 items-center justify-center rounded-full border transition " +
                      (settingsOpen
                        ? "border-purple-400 bg-white/12 text-white"
                        : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                    }
                    onClick={() => setSettingsOpen((current) => !current)}
                    aria-label="Reader settings"
                    title="Reader settings"
                  >
                    <Settings2 className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          {showNovelControls && settingsOpen ? (
            <div className="border-t border-white/10 px-4 pb-4 pt-3" onClick={(e) => e.stopPropagation()}>
              <div className="max-h-[68svh] overflow-y-auto rounded-[28px] border border-white/10 bg-[#091223]/95 p-4 shadow-[0_28px_80px_-48px_rgba(2,8,23,0.95)]">
                <div>
                  <div className="text-sm font-semibold text-white">Reader appearance</div>
                  <div className="mt-1 text-xs text-slate-400">Pick a mood that fits the chapter without leaving the page.</div>
                </div>

                <div className="mt-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Page color</div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {themeOptions.map((option) => {
                      const active = novelPreferences.theme === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => updatePreferences({ theme: option.value })}
                          className={
                            "rounded-2xl border p-2 text-left transition " +
                            (active ? "border-purple-400 bg-purple-500/10" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]")
                          }
                        >
                          <div className={`h-14 rounded-xl border ${option.swatchClassName}`} />
                          <div className="mt-2 text-xs font-semibold text-white">{option.label}</div>
                          <div className="text-[11px] text-slate-400">{option.helper}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Font size</div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <SettingChip
                        label="Aa-"
                        active={novelPreferences.fontScale <= 0.96}
                        onClick={() => updatePreferences({ fontScale: Math.max(0.9, Number((novelPreferences.fontScale - 0.08).toFixed(2))) })}
                      />
                      <SettingChip
                        label="Aa+"
                        active={novelPreferences.fontScale >= 1.08}
                        onClick={() => updatePreferences({ fontScale: Math.min(1.3, Number((novelPreferences.fontScale + 0.08).toFixed(2))) })}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Spacing</div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <SettingChip
                        label="Cozy"
                        active={novelPreferences.lineSpacing === "comfortable"}
                        onClick={() => updatePreferences({ lineSpacing: "comfortable" })}
                      />
                      <SettingChip
                        label="Airy"
                        active={novelPreferences.lineSpacing === "airy"}
                        onClick={() => updatePreferences({ lineSpacing: "airy" })}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Font style</div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <SettingChip
                      label="Serif"
                      active={novelPreferences.fontFamily === "serif"}
                      onClick={() => updatePreferences({ fontFamily: "serif" })}
                    />
                    <SettingChip
                      label="Sans"
                      active={novelPreferences.fontFamily === "sans"}
                      onClick={() => updatePreferences({ fontFamily: "sans" })}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div
        className={`fixed inset-x-0 bottom-0 z-50 lg:hidden transition-all duration-200 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
        }`}
      >
        <div className="bg-white/85 backdrop-blur border-t border-gray-200 dark:border-gray-800 dark:bg-gray-950/75">
          <div className="px-4 py-2">
            <div className="flex items-center justify-between gap-2">
              {hrefPrev ? (
                <Link
                  href={hrefPrev}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Previous"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Link>
              ) : (
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 opacity-40 dark:border-gray-800">
                  <ChevronLeft className="h-5 w-5" />
                </span>
              )}

              <Link
                href={hrefMenu}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900"
                onClick={(e) => e.stopPropagation()}
                aria-label="Menu"
              >
                <LayoutGrid className="h-5 w-5" />
              </Link>

              {hrefNext ? (
                <Link
                  href={hrefNext}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Next"
                >
                  <ChevronRight className="h-5 w-5" />
                </Link>
              ) : (
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 opacity-40 dark:border-gray-800">
                  <ChevronRight className="h-5 w-5" />
                </span>
              )}

              <div onClick={(e) => e.stopPropagation()}>
                <ChapterLikeButton chapterId={chapterId} initialLiked={initialLiked} initialCount={initialLikeCount} variant="icon" />
              </div>

              <Link
                href={hrefComments}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900"
                onClick={(e) => e.stopPropagation()}
                aria-label="Comments"
              >
                <MessageCircle className="h-5 w-5" />
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

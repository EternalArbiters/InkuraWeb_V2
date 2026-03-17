"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { MouseEvent as ReactMouseEvent, ReactNode } from "react";
import { BookOpen, ChevronLeft, ChevronRight, LayoutGrid, MessageCircle, Settings2, Smartphone } from "lucide-react";
import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";
import ChapterLikeButton from "@/app/components/work/ChapterLikeButton";
import {
  DEFAULT_NOVEL_READER_PREFERENCES,
  NOVEL_READER_FONT_OPTIONS,
  NOVEL_READER_PREFERENCES_EVENT,
  NOVEL_READER_PREFERENCES_KEY,
  NOVEL_READER_THEME_OPTIONS,
  type NovelReaderPreferences,
  loadNovelReaderPreferences,
  updateNovelReaderPreferences,
} from "@/app/components/reader/novelReaderPreferences";

const READ_CHAPTERS_STORAGE_PREFIX = "inkura:read-chapters:";

const FONT_SCALE_STEP = 0.05;
const MIN_FONT_SCALE = 0.9;
const MAX_FONT_SCALE = 1.3;

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

function SettingChip({
  active,
  label,
  onClick,
  disabled = false,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        "inline-flex min-h-11 items-center justify-center rounded-2xl border px-3 text-sm font-semibold transition " +
        (disabled
          ? "cursor-not-allowed border-gray-200 bg-gray-100 text-slate-400 dark:border-white/5 dark:bg-white/[0.03] dark:text-slate-500"
          : active
            ? "border-purple-500 bg-purple-600 text-white shadow-[0_14px_30px_-20px_rgba(168,85,247,0.9)]"
            : "border-gray-200 bg-white text-slate-700 hover:border-gray-300 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-white/20 dark:hover:bg-white/10")
      }
    >
      {label}
    </button>
  );
}

function RailOption({
  active,
  ariaLabel,
  previewText,
  previewClassName,
  swatchClassName,
  onClick,
}: {
  active: boolean;
  ariaLabel: string;
  previewText?: string;
  previewClassName?: string;
  swatchClassName?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={
        "flex min-w-[124px] snap-start flex-col rounded-2xl border p-2 text-left transition " +
        (active
          ? "border-purple-400 bg-purple-500/10"
          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/20 dark:hover:bg-white/[0.06]")
      }
    >
      {swatchClassName ? (
        <div className={`h-14 rounded-[1rem] border ${swatchClassName}`} />
      ) : (
        <div className="flex h-16 items-center justify-center rounded-[1rem] border border-gray-200 bg-slate-50 px-2.5 text-center text-slate-900 dark:border-white/10 dark:bg-[#0b1427] dark:text-white/92">
          <span className={previewClassName}>{previewText}</span>
        </div>
      )}
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
  const t = useUILanguageText("Page Reader");
  const [visible, setVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [novelPreferences, setNovelPreferences] = useState<NovelReaderPreferences>(DEFAULT_NOVEL_READER_PREFERENCES);
  const [readerMode, setReaderMode] = useState<NovelReaderPreferences["mode"]>(DEFAULT_NOVEL_READER_PREFERENCES.mode);
  const showNovelControls = readerType === "NOVEL";

  useEffect(() => {
    if (!workId || !chapterId) return;
    rememberReadChapter(workSlug, chapterId);
    fetch(`/api/progress`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ workId, chapterId, progress: 0 }),
    }).catch(() => null);
  }, [workId, chapterId, workSlug]);

  useEffect(() => {
    if (!showNovelControls || typeof window === "undefined") return;
    const initialPreferences = loadNovelReaderPreferences();
    setNovelPreferences(initialPreferences);
    setReaderMode(initialPreferences.mode);

    const syncPreferences = () => {
      const next = loadNovelReaderPreferences();
      setNovelPreferences(next);
      setReaderMode(next.mode);
    };
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;

    if (!showNovelControls) {
      delete root.dataset.readerMode;
      window.dispatchEvent(new CustomEvent("inkura:reader-mode-change", { detail: { mode: null } }));
      return () => {
        delete root.dataset.readerMode;
        window.dispatchEvent(new CustomEvent("inkura:reader-mode-change", { detail: { mode: null } }));
      };
    }

    root.dataset.readerMode = readerMode;
    window.dispatchEvent(new CustomEvent("inkura:reader-mode-change", { detail: { mode: readerMode } }));
    return () => {
      delete root.dataset.readerMode;
      window.dispatchEvent(new CustomEvent("inkura:reader-mode-change", { detail: { mode: null } }));
    };
  }, [readerMode, showNovelControls]);

  const hrefPrev = useMemo(() => (prevId ? `/w/${workSlug}/read/${prevId}` : null), [prevId, workSlug]);
  const hrefNext = useMemo(() => (nextId ? `/w/${workSlug}/read/${nextId}` : null), [nextId, workSlug]);
  const hrefMenu = useMemo(() => `/w/${workSlug}`, [workSlug]);
  const hrefComments = useMemo(() => `/w/${workSlug}/read/${chapterId}/comments`, [workSlug, chapterId]);

  const toggle = useCallback((e: ReactMouseEvent) => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) return;
    if (isInteractiveTarget(e.target)) return;
    setVisible((current) => !current);
  }, []);

  const updatePreferences = useCallback((patch: Partial<NovelReaderPreferences>) => {
    const next = updateNovelReaderPreferences(patch);
    setNovelPreferences(next);
    setReaderMode(next.mode);
  }, []);

  const decreaseFontScale = useCallback(() => {
    updatePreferences({ fontScale: novelPreferences.fontScale - FONT_SCALE_STEP });
  }, [novelPreferences.fontScale, updatePreferences]);

  const increaseFontScale = useCallback(() => {
    updatePreferences({ fontScale: novelPreferences.fontScale + FONT_SCALE_STEP });
  }, [novelPreferences.fontScale, updatePreferences]);

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
      <div
        className={`fixed inset-x-0 top-0 z-50 lg:hidden transition-all duration-200 ${
          visible ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
        }`}
      >
        <div className="border-b border-gray-200 bg-white/92 text-slate-900 backdrop-blur-xl dark:border-white/10 dark:bg-[#030917]/90 dark:text-white">
          <div className="px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-slate-500 dark:text-slate-300">{workTitle}</div>
                <div className="truncate text-sm font-extrabold tracking-tight text-slate-950 dark:text-white">{chapterTitle}</div>
              </div>

              {showNovelControls ? (
                <div className="flex shrink-0 items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className={
                      "inline-flex h-10 w-10 items-center justify-center rounded-full border transition " +
                      (novelPreferences.mode === "scroll"
                        ? "border-purple-400 bg-purple-600 text-white shadow-[0_12px_26px_-18px_rgba(168,85,247,0.9)]"
                        : "border-gray-200 bg-white/80 text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10")
                    }
                    onClick={() => updatePreferences({ mode: "scroll" })}
                    aria-label={t("Scroll mode")}
                    title={t("Scroll mode")}
                  >
                    <Smartphone className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={
                      "inline-flex h-10 w-10 items-center justify-center rounded-full border transition " +
                      (novelPreferences.mode === "slide"
                        ? "border-purple-400 bg-purple-600 text-white shadow-[0_12px_26px_-18px_rgba(168,85,247,0.9)]"
                        : "border-gray-200 bg-white/80 text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10")
                    }
                    onClick={() => updatePreferences({ mode: "slide" })}
                    aria-label={t("Slide mode")}
                    title={t("Slide mode")}
                  >
                    <BookOpen className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={
                      "inline-flex h-10 w-10 items-center justify-center rounded-full border transition " +
                      (settingsOpen
                        ? "border-purple-400 bg-purple-600 text-white shadow-[0_12px_26px_-18px_rgba(168,85,247,0.9)]"
                        : "border-gray-200 bg-white/80 text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10")
                    }
                    onClick={() => setSettingsOpen((current) => !current)}
                    aria-label={t("Reader settings")}
                    title={t("Reader settings")}
                  >
                    <Settings2 className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          {showNovelControls && settingsOpen ? (
            <div className="border-t border-gray-200 px-4 pb-4 pt-3 dark:border-white/10" onClick={(e) => e.stopPropagation()}>
              <div className="rounded-[2rem] border border-gray-200 bg-white/96 p-4 shadow-2xl dark:border-white/10 dark:bg-[#081126]/96">
                <h2 className="text-xl font-extrabold tracking-tight text-slate-950 dark:text-white">{t("Reader appearance")}</h2>

                <div className="mt-6 space-y-6">
                  <section>
                    <div className="text-xs font-bold uppercase tracking-[0.38em] text-slate-500 dark:text-slate-300">{t("Page color")}</div>
                    <div className="-mx-1 mt-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      <div className="flex w-max gap-2.5">
                        {NOVEL_READER_THEME_OPTIONS.map((option) => (
                          <RailOption
                            key={option.value}
                            active={novelPreferences.theme === option.value}
                            ariaLabel={t(option.labelKey)}
                            swatchClassName={option.swatchClassName}
                            onClick={() => updatePreferences({ theme: option.value })}
                          />
                        ))}
                      </div>
                    </div>
                  </section>

                  <div className="grid grid-cols-2 gap-4">
                    <section>
                      <div className="text-xs font-bold uppercase tracking-[0.38em] text-slate-500 dark:text-slate-300">{t("Font size")}</div>
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <SettingChip
                          active={false}
                          disabled={novelPreferences.fontScale <= MIN_FONT_SCALE}
                          label="Aa-"
                          onClick={decreaseFontScale}
                        />
                        <SettingChip
                          active={false}
                          disabled={novelPreferences.fontScale >= MAX_FONT_SCALE}
                          label="Aa+"
                          onClick={increaseFontScale}
                        />
                      </div>
                    </section>

                    <section>
                      <div className="text-xs font-bold uppercase tracking-[0.38em] text-slate-500 dark:text-slate-300">{t("Spacing")}</div>
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <SettingChip
                          active={novelPreferences.lineSpacing === "comfortable"}
                          label={t("Cozy")}
                          onClick={() => updatePreferences({ lineSpacing: "comfortable" })}
                        />
                        <SettingChip
                          active={novelPreferences.lineSpacing === "airy"}
                          label={t("Airy")}
                          onClick={() => updatePreferences({ lineSpacing: "airy" })}
                        />
                      </div>
                    </section>
                  </div>

                  <section>
                    <div className="text-xs font-bold uppercase tracking-[0.38em] text-slate-500 dark:text-slate-300">{t("Font")}</div>
                    <div className="-mx-1 mt-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      <div className="flex w-max gap-2.5">
                        {NOVEL_READER_FONT_OPTIONS.map((option) => (
                          <RailOption
                            key={option.value}
                            active={novelPreferences.fontFamily === option.value}
                            ariaLabel={t(option.labelKey)}
                            previewText={option.previewText}
                            previewClassName={option.previewClassName}
                            onClick={() => updatePreferences({ fontFamily: option.value })}
                          />
                        ))}
                      </div>
                    </div>
                  </section>
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
        <div className="bg-white/85 dark:bg-gray-950/75 backdrop-blur border-t border-gray-200 dark:border-gray-800">
          <div className="px-4 py-2">
            <div className="flex items-center justify-between gap-2">
              {hrefPrev ? (
                <Link
                  href={hrefPrev}
                  className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
                  onClick={(e) => e.stopPropagation()}
                  aria-label={t("Previous")}
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
                aria-label={t("Menu")}
              >
                <LayoutGrid className="w-5 h-5" />
              </Link>

              {hrefNext ? (
                <Link
                  href={hrefNext}
                  className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
                  onClick={(e) => e.stopPropagation()}
                  aria-label={t("Next")}
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
                aria-label={t("Comments")}
              >
                <MessageCircle className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="relative">{children}</div>
    </div>
  );
}

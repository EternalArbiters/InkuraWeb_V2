"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { MouseEvent as ReactMouseEvent, ReactNode } from "react";
import { BookOpen, ChevronLeft, ChevronRight, LayoutGrid, MessageCircle, Settings2, Smartphone } from "lucide-react";
import { useUILanguage } from "@/app/components/ui-language/UILanguageProvider";
import ChapterLikeButton from "@/app/components/work/ChapterLikeButton";
import {
  DEFAULT_NOVEL_READER_PREFERENCES,
  NOVEL_READER_PREFERENCES_EVENT,
  NOVEL_READER_PREFERENCES_KEY,
  type NovelReaderPreferences,
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

function pickLanguage(language: string, en: string, id: string) {
  return language === "ID" ? id : en;
}

const themeOptions: Array<{
  value: NovelReaderPreferences["theme"];
  swatchClassName: string;
  labels: { EN: string; ID: string };
}> = [
  {
    value: "paper",
    labels: { EN: "Paper", ID: "Kertas" },
    swatchClassName: "border-slate-200 bg-[#f7f5ef]",
  },
  {
    value: "midnight",
    labels: { EN: "Midnight", ID: "Malam" },
    swatchClassName: "border-[#17243d] bg-[#030917]",
  },
  {
    value: "sepia",
    labels: { EN: "Sepia", ID: "Sepia" },
    swatchClassName: "border-[#d9c7a3] bg-[#efe3cb]",
  },
  {
    value: "mist",
    labels: { EN: "Mist", ID: "Kabut" },
    swatchClassName: "border-[#bfd0e7] bg-[#e7edf5]",
  },
  {
    value: "forest",
    labels: { EN: "Forest", ID: "Hutan" },
    swatchClassName: "border-[#26433a] bg-[#0f1a16]",
  },
  {
    value: "rose",
    labels: { EN: "Rose", ID: "Mawar" },
    swatchClassName: "border-[#d9b9c7] bg-[#f5e8e8]",
  },
];

const fontOptions: Array<{
  value: NovelReaderPreferences["fontFamily"];
  label: string;
  previewClassName: string;
}> = [
  { value: "serif", label: "Serif", previewClassName: "font-serif" },
  { value: "sans", label: "Sans", previewClassName: "font-sans" },
  { value: "book", label: "Book", previewClassName: "font-serif italic" },
  { value: "classic", label: "Classic", previewClassName: "font-serif tracking-[0.02em]" },
  { value: "mono", label: "Mono", previewClassName: "font-mono" },
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

function RailOption({
  active,
  label,
  preview,
  swatchClassName,
  onClick,
}: {
  active: boolean;
  label: string;
  preview?: string;
  swatchClassName?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex min-w-[112px] snap-start flex-col rounded-2xl border p-2.5 text-left transition " +
        (active
          ? "border-purple-400 bg-purple-500/10"
          : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]")
      }
    >
      {swatchClassName ? (
        <div className={`h-14 rounded-xl border ${swatchClassName}`} />
      ) : (
        <div className="flex h-14 items-center justify-center rounded-xl border border-white/10 bg-[#0b1427] px-3 text-center text-lg text-white/90">
          <span className={preview}>{label}</span>
        </div>
      )}
      <span className="mt-2 text-xs font-semibold text-white">{label}</span>
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
  const { language } = useUILanguage();
  const [visible, setVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [novelPreferences, setNovelPreferences] = useState<NovelReaderPreferences>(DEFAULT_NOVEL_READER_PREFERENCES);
  const showNovelControls = readerType === "NOVEL";

  const text = useMemo(
    () => ({
      scrollMode: pickLanguage(language, "Scroll mode", "Mode gulir"),
      slideMode: pickLanguage(language, "Slide mode", "Mode slide"),
      readerSettings: pickLanguage(language, "Reader settings", "Pengaturan baca"),
      readerAppearance: pickLanguage(language, "Reader appearance", "Tampilan baca"),
      pageColor: pickLanguage(language, "Page color", "Warna halaman"),
      fontSize: pickLanguage(language, "Font size", "Ukuran font"),
      spacing: pickLanguage(language, "Spacing", "Jarak"),
      font: pickLanguage(language, "Font", "Font"),
      previous: pickLanguage(language, "Previous", "Sebelumnya"),
      next: pickLanguage(language, "Next", "Berikutnya"),
      menu: pickLanguage(language, "Menu", "Menu"),
      comments: pickLanguage(language, "Comments", "Komentar"),
      cozy: pickLanguage(language, "Cozy", "Rapat"),
      airy: pickLanguage(language, "Airy", "Lega"),
    }),
    [language]
  );

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

  const toggle = useCallback((e: ReactMouseEvent) => {
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
                    aria-label={text.scrollMode}
                    title={text.scrollMode}
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
                    aria-label={text.slideMode}
                    title={text.slideMode}
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
                    aria-label={text.readerSettings}
                    title={text.readerSettings}
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
                <div className="text-sm font-semibold text-white">{text.readerAppearance}</div>

                <div className="mt-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{text.pageColor}</div>
                  <div className="-mx-1 mt-3 overflow-x-auto pb-1">
                    <div className="flex snap-x gap-3 px-1">
                      {themeOptions.map((option) => {
                        const active = novelPreferences.theme === option.value;
                        return (
                          <RailOption
                            key={option.value}
                            active={active}
                            label={option.labels[language as "EN" | "ID"] ?? option.labels.EN}
                            swatchClassName={option.swatchClassName}
                            onClick={() => updatePreferences({ theme: option.value })}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{text.fontSize}</div>
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
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{text.spacing}</div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <SettingChip
                        label={text.cozy}
                        active={novelPreferences.lineSpacing === "comfortable"}
                        onClick={() => updatePreferences({ lineSpacing: "comfortable" })}
                      />
                      <SettingChip
                        label={text.airy}
                        active={novelPreferences.lineSpacing === "airy"}
                        onClick={() => updatePreferences({ lineSpacing: "airy" })}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{text.font}</div>
                  <div className="-mx-1 mt-3 overflow-x-auto pb-1">
                    <div className="flex snap-x gap-3 px-1">
                      {fontOptions.map((option) => (
                        <RailOption
                          key={option.value}
                          active={novelPreferences.fontFamily === option.value}
                          label={option.label}
                          preview={option.previewClassName}
                          onClick={() => updatePreferences({ fontFamily: option.value })}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div
        className={`fixed inset-x-0 bottom-0 z-50 lg:hidden transition-all duration-200 ${
          visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
        }`}
      >
        <div className="border-t border-gray-200 bg-white/85 backdrop-blur dark:border-gray-800 dark:bg-gray-950/75">
          <div className="px-4 py-2">
            <div className="flex items-center justify-between gap-2">
              {hrefPrev ? (
                <Link
                  href={hrefPrev}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900"
                  onClick={(e) => e.stopPropagation()}
                  aria-label={text.previous}
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
                aria-label={text.menu}
              >
                <LayoutGrid className="h-5 w-5" />
              </Link>

              {hrefNext ? (
                <Link
                  href={hrefNext}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900"
                  onClick={(e) => e.stopPropagation()}
                  aria-label={text.next}
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
                aria-label={text.comments}
              >
                <MessageCircle className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="relative">{children}</div>
    </div>
  );
}

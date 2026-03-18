"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUp, BookOpen, ChevronLeft, ChevronRight, LayoutGrid, MessageCircle, Settings2, Smartphone, Heart } from "lucide-react";
import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";
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
import { readChapterInteraction, seedChapterInteraction, subscribeChapterInteraction, updateChapterInteraction } from "@/lib/chapterInteractionStore";

const FONT_SCALE_STEP = 0.05;
const MIN_FONT_SCALE = 0.9;
const MAX_FONT_SCALE = 1.3;

function ReaderRailButton({
  children,
  ariaLabel,
  title,
  href,
  onClick,
  disabled = false,
  active = false,
}: {
  children: ReactNode;
  ariaLabel: string;
  title?: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  const className =
    "inline-flex h-12 w-12 items-center justify-center rounded-full border backdrop-blur transition focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/70 " +
    (disabled
      ? "border-white/10 bg-[#081126]/55 text-white/35 opacity-45 pointer-events-none"
      : active
        ? "border-fuchsia-400/70 bg-gradient-to-br from-fuchsia-500/28 to-violet-500/28 text-white shadow-[0_18px_36px_-22px_rgba(168,85,247,0.9)]"
        : "border-white/10 bg-[#081126]/88 text-white/88 shadow-[0_18px_36px_-26px_rgba(2,8,23,0.85)] hover:bg-[#0d1830] hover:text-white");

  if (href) {
    return (
      <Link href={href} aria-label={ariaLabel} title={title || ariaLabel} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title={title || ariaLabel}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={className}
    >
      {children}
    </button>
  );
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
          ? "cursor-not-allowed border-white/10 bg-white/[0.03] text-slate-500"
          : active
            ? "border-purple-400 bg-purple-600 text-white shadow-[0_14px_30px_-20px_rgba(168,85,247,0.9)]"
            : "border-white/10 bg-white/[0.03] text-white/86 hover:border-white/20 hover:bg-white/[0.07]")
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
        "flex min-w-[118px] snap-start flex-col rounded-2xl border p-2 text-left transition " +
        (active
          ? "border-purple-400 bg-purple-500/10"
          : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]")
      }
    >
      {swatchClassName ? (
        <div className={`h-14 rounded-[1rem] border ${swatchClassName}`} />
      ) : (
        <div className="flex h-16 items-center justify-center rounded-[1rem] border border-white/10 bg-[#0b1427] px-2.5 text-center text-white/92">
          <span className={previewClassName}>{previewText}</span>
        </div>
      )}
    </button>
  );
}

function DesktopRailLikeButton({
  chapterId,
  initialLiked,
  initialCount,
}: {
  chapterId: string;
  initialLiked: boolean;
  initialCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useUILanguageText("Shared Floating Actions");
  const [isPending, startTransition] = useTransition();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    seedChapterInteraction(chapterId, { liked: initialLiked, likeCount: initialCount });
    const sync = () => {
      const state = readChapterInteraction(chapterId);
      setLiked(state.liked ?? initialLiked);
      setCount(state.likeCount ?? initialCount);
    };
    sync();
    return subscribeChapterInteraction(chapterId, sync);
  }, [chapterId, initialCount, initialLiked]);

  const toggle = useCallback(() => {
    startTransition(async () => {
      const res = await fetch(`/api/chapters/${chapterId}/like`, { method: "POST" });
      if (res.status === 401) {
        router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname || "/")}`);
        return;
      }
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) return;
      updateChapterInteraction(chapterId, (current) => ({
        ...current,
        liked: !!data.liked,
        likeCount: typeof data.likeCount === "number" ? data.likeCount : current.likeCount ?? initialCount,
      }));
    });
  }, [chapterId, initialCount, pathname, router]);

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      aria-label={liked ? `${t("Liked")} (${count})` : `${t("Like chapter")} (${count})`}
      title={liked ? `${t("Liked")} (${count})` : `${t("Like chapter")} (${count})`}
      aria-pressed={liked}
      className={
        "inline-flex h-12 w-12 items-center justify-center rounded-full border backdrop-blur transition focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/70 " +
        (isPending
          ? "border-white/10 bg-[#081126]/55 text-white/35 opacity-45"
          : liked
            ? "border-fuchsia-400/70 bg-gradient-to-br from-fuchsia-500/28 to-violet-500/28 text-white shadow-[0_18px_36px_-22px_rgba(168,85,247,0.9)]"
            : "border-white/10 bg-[#081126]/88 text-white/88 shadow-[0_18px_36px_-26px_rgba(2,8,23,0.85)] hover:bg-[#0d1830] hover:text-white")
      }
    >
      <span className="relative inline-flex items-center justify-center">
        <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
        <span className="absolute -bottom-2.5 -right-3 rounded-full bg-[#050d1f] px-1 text-[10px] font-extrabold leading-4 text-white/90 ring-1 ring-white/10">
          {count}
        </span>
      </span>
    </button>
  );
}

export default function DesktopReaderSidebar({
  workSlug,
  chapterId,
  prevId,
  nextId,
  initialLiked,
  initialLikeCount,
  readerType,
  children,
}: {
  workSlug: string;
  chapterId: string;
  prevId: string | null;
  nextId: string | null;
  initialLiked: boolean;
  initialLikeCount: number;
  readerType: "NOVEL" | "COMIC";
  children: ReactNode;
}) {
  const t = useUILanguageText("Page Reader");
  const tFloating = useUILanguageText("Shared Floating Actions");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [novelPreferences, setNovelPreferences] = useState<NovelReaderPreferences>(DEFAULT_NOVEL_READER_PREFERENCES);
  const showNovelControls = readerType === "NOVEL";

  useEffect(() => {
    if (!showNovelControls || typeof window === "undefined") return;

    const syncPreferences = () => {
      setNovelPreferences(loadNovelReaderPreferences());
    };

    syncPreferences();
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

  const updatePreferences = useCallback((patch: Partial<NovelReaderPreferences>) => {
    const next = updateNovelReaderPreferences(patch);
    setNovelPreferences(next);
  }, []);

  const decreaseFontScale = useCallback(() => {
    updatePreferences({ fontScale: novelPreferences.fontScale - FONT_SCALE_STEP });
  }, [novelPreferences.fontScale, updatePreferences]);

  const increaseFontScale = useCallback(() => {
    updatePreferences({ fontScale: novelPreferences.fontScale + FONT_SCALE_STEP });
  }, [novelPreferences.fontScale, updatePreferences]);

  const hrefPrev = useMemo(() => (prevId ? `/w/${workSlug}/read/${prevId}` : null), [prevId, workSlug]);
  const hrefNext = useMemo(() => (nextId ? `/w/${workSlug}/read/${nextId}` : null), [nextId, workSlug]);
  const hrefMenu = useMemo(() => `/w/${workSlug}`, [workSlug]);

  const scrollToComments = useCallback(() => {
    const commentsEl = document.getElementById("reader-comments-panel");
    if (commentsEl) {
      commentsEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  return (
    <div className="relative">
      <div className="fixed right-4 top-24 z-40 flex flex-col items-center gap-3">
        <ReaderRailButton ariaLabel={tFloating("Scroll to top")} title={tFloating("Scroll to top")} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <ArrowUp className="h-5 w-5" />
        </ReaderRailButton>

        <DesktopRailLikeButton chapterId={chapterId} initialLiked={initialLiked} initialCount={initialLikeCount} />

        <ReaderRailButton ariaLabel={t("Comments")} title={t("Comments")} onClick={scrollToComments}>
          <MessageCircle className="h-5 w-5" />
        </ReaderRailButton>

        {hrefPrev ? (
          <ReaderRailButton ariaLabel={t("Previous")} title={t("Previous")} href={hrefPrev}>
            <ChevronLeft className="h-5 w-5" />
          </ReaderRailButton>
        ) : (
          <ReaderRailButton ariaLabel={t("Previous")} title={t("Previous")} disabled>
            <ChevronLeft className="h-5 w-5" />
          </ReaderRailButton>
        )}

        <ReaderRailButton ariaLabel={t("Menu")} title={t("Menu")} href={hrefMenu}>
          <LayoutGrid className="h-5 w-5" />
        </ReaderRailButton>

        {hrefNext ? (
          <ReaderRailButton ariaLabel={t("Next")} title={t("Next")} href={hrefNext}>
            <ChevronRight className="h-5 w-5" />
          </ReaderRailButton>
        ) : (
          <ReaderRailButton ariaLabel={t("Next")} title={t("Next")} disabled>
            <ChevronRight className="h-5 w-5" />
          </ReaderRailButton>
        )}
      </div>

      {showNovelControls ? (
        <div className="mb-4 space-y-3">
          <div className="flex items-center gap-2 rounded-[1.75rem] border border-white/10 bg-[#081126]/88 p-2 shadow-[0_20px_44px_-26px_rgba(2,8,23,0.88)] backdrop-blur">
            <ReaderRailButton
              ariaLabel={t("Scroll mode")}
              title={t("Scroll mode")}
              onClick={() => updatePreferences({ mode: "scroll" })}
              active={novelPreferences.mode === "scroll"}
            >
              <Smartphone className="h-[18px] w-[18px]" />
            </ReaderRailButton>
            <ReaderRailButton
              ariaLabel={t("Slide mode")}
              title={t("Slide mode")}
              onClick={() => updatePreferences({ mode: "slide" })}
              active={novelPreferences.mode === "slide"}
            >
              <BookOpen className="h-[18px] w-[18px]" />
            </ReaderRailButton>
            <ReaderRailButton
              ariaLabel={t("Reader settings")}
              title={t("Reader settings")}
              onClick={() => setSettingsOpen((current) => !current)}
              active={settingsOpen}
            >
              <Settings2 className="h-[18px] w-[18px]" />
            </ReaderRailButton>
          </div>

          {settingsOpen ? (
            <div className="rounded-[2rem] border border-white/10 bg-[#081126]/96 p-4 shadow-2xl backdrop-blur">
              <h2 className="text-xl font-extrabold tracking-tight text-white">{t("Reader appearance")}</h2>

              <div className="mt-6 space-y-6">
                <section>
                  <div className="text-xs font-bold uppercase tracking-[0.38em] text-slate-300">{t("Page color")}</div>
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
                    <div className="text-xs font-bold uppercase tracking-[0.38em] text-slate-300">{t("Font size")}</div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <SettingChip active={false} disabled={novelPreferences.fontScale <= MIN_FONT_SCALE} label="Aa-" onClick={decreaseFontScale} />
                      <SettingChip active={false} disabled={novelPreferences.fontScale >= MAX_FONT_SCALE} label="Aa+" onClick={increaseFontScale} />
                    </div>
                  </section>

                  <section>
                    <div className="text-xs font-bold uppercase tracking-[0.38em] text-slate-300">{t("Spacing")}</div>
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
                  <div className="text-xs font-bold uppercase tracking-[0.38em] text-slate-300">{t("Font")}</div>
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
          ) : null}
        </div>
      ) : null}

      <div className="space-y-4">{children}</div>
    </div>
  );
}

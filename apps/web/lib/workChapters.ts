import { getChapterDisplayLabel, getChapterSecondaryTitle } from "@/lib/chapterLabel";

export type ChapterLite = {
  id: string;
  number: number;
  title: string;
  label?: string | null;
  status?: string | null;
  publishedAt?: string | null;
  createdAt?: string | null;
  isMature?: boolean | null;
  thumbnailUrl?: string | null;
  thumbnailImage?: string | null;
  thumbnailKey?: string | null;
  thumbnailFocusX?: number | null;
  thumbnailFocusY?: number | null;
  thumbnailZoom?: number | null;
  pages?: { imageUrl: string }[];
};

export function stablePickChapterThumb(chapterId: string, candidates: string[]) {
  if (!candidates.length) return null;
  let h = 0;
  for (let i = 0; i < chapterId.length; i++) h = (h * 31 + chapterId.charCodeAt(i)) >>> 0;
  const idx = h % candidates.length;
  return candidates[idx] || null;
}

export function resolveChapterThumb(chapter: ChapterLite) {
  const candidates = (chapter.pages || []).map((page) => page.imageUrl).filter(Boolean);
  return chapter.thumbnailUrl || chapter.thumbnailImage || stablePickChapterThumb(String(chapter.id), candidates) || null;
}

export function sortChaptersAscending(chapters: ChapterLite[]) {
  return [...(chapters || [])].sort((a, b) => {
    const numberDiff = Number(a.number || 0) - Number(b.number || 0);
    if (numberDiff !== 0) return numberDiff;
    const aTime = Date.parse(a.createdAt || "") || 0;
    const bTime = Date.parse(b.createdAt || "") || 0;
    return aTime - bTime;
  });
}

export function getContinueChapterHref(slug: string, chapters: ChapterLite[], lastReadChapterId?: string | null) {
  const rememberedId = typeof lastReadChapterId === "string" ? lastReadChapterId.trim() : "";
  if (rememberedId) return `/w/${slug}/read/${rememberedId}`;
  const firstChapter = sortChaptersAscending(chapters)[0];
  return firstChapter?.id ? `/w/${slug}/read/${firstChapter.id}` : null;
}

export function formatChapterDateLabel(dateValue?: string | null, locale?: string | string[]) {
  const time = Date.parse(dateValue || "");
  if (!Number.isFinite(time)) return null;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(time));
}

export function getNovelChapterTitle(chapter: Pick<ChapterLite, "number" | "label" | "title">) {
  const displayLabel = getChapterDisplayLabel(chapter.number, chapter.label);
  const secondaryTitle = getChapterSecondaryTitle(chapter.number, chapter.title, chapter.label);
  return secondaryTitle ? `${displayLabel} [ ${secondaryTitle} ]` : displayLabel;
}

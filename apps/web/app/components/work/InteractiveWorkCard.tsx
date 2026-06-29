import ModernWorkCard from "@/app/components/work/ModernWorkCard";

type Person = {
  username?: string | null;
  name?: string | null;
  image?: string | null;
} | null | undefined;

type Genre =
  | {
      name?: string | null;
      slug?: string | null;
    }
  | string
  | null
  | undefined;

type WorkCardData = {
  id: string;
  slug?: string | null;
  title?: string | null;
  coverImage?: string | null;
  status?: string | null;
  type?: string | null;
  comicType?: string | null;
  publishType?: string | null;
  isMature?: boolean | null;
  deviantLoveTags?: Genre[] | null;
  language?: string | null;
  completion?: string | null;
  chapterCount?: number | null;
  likeCount?: number | null;
  chapterLoveCount?: number | null;
  ratingAvg?: number | null;
  ratingCount?: number | null;
  updatedAt?: string | Date | null;
  lastChapterPublishedAt?: string | Date | null;
  author?: Person;
  translator?: Person;
  viewerBookmarked?: boolean | null;
  genres?: Genre[] | null;
};

type Props = {
  work: WorkCardData;
  className?: string;
  showRecentUpdateBadge?: boolean;
  blurImage?: boolean;
  showBookmarkButton?: boolean;
  showUpdatedSubtitle?: boolean;
  analyticsClickEvent?: Record<string, unknown> | null;
  topLeftBadge?: string | null;
  bottomRightBadge?: string | null;
};

/**
 * Work card. Inkura has committed to the modern design, so this now always
 * renders {@link ModernWorkCard}. It keeps the original prop surface so existing
 * callers (search grid, library, series arcs, …) keep working, forwarding every
 * functional prop — including search-result click analytics and the
 * recently-updated / current-arc badges — through to the modern card.
 */
export default function InteractiveWorkCard({
  work,
  className,
  showRecentUpdateBadge = false,
  blurImage = false,
  showBookmarkButton = false,
  showUpdatedSubtitle = false,
  analyticsClickEvent = null,
  topLeftBadge = null,
  bottomRightBadge = null,
}: Props) {
  return (
    <ModernWorkCard
      work={work as any}
      className={className}
      showBookmark={showBookmarkButton}
      blurImage={blurImage}
      topLeftBadge={topLeftBadge}
      bottomRightBadge={bottomRightBadge}
      showUpdatedAt={showUpdatedSubtitle}
      showRecentUpdateBadge={showRecentUpdateBadge}
      analyticsClickEvent={analyticsClickEvent}
    />
  );
}

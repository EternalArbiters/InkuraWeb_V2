import Link from "next/link";
import { notFound } from "next/navigation";
import ContentWarningsGate from "@/components/ContentWarningsGate";
import { getWorkPageDataBySlug } from "@/server/services/works/workPage";
import { fetchComments } from "@/server/services/comments/fetchComments";
import { listWorkReviews } from "@/server/services/reviews/listWorkReviews";
import { listReadingListOptionsForViewer } from "@/server/services/readingLists/readingLists";
import WorkCoverBadges from "../../components/WorkCoverBadges";
import LockLabel from "@/app/components/LockLabel";
import CommentSection from "@/app/components/work/CommentSection";
import LikeButton from "@/app/components/work/LikeButton";
import BookmarkButton from "@/app/components/work/BookmarkButton";
import RatingStars from "@/app/components/work/RatingStars";
import ShareButton from "@/app/components/work/ShareButton";
import AddToListButton from "@/app/components/work/AddToListButton";
import ReviewSection from "@/app/components/work/ReviewSection";
import WorkInfoPanel from "@/app/components/work/WorkInfoPanel";
import WorkChaptersWebtoon from "@/app/components/work/WorkChaptersWebtoon";
import SeriesArcsPanel from "@/app/components/work/SeriesArcsPanel";
import UploaderIdentityLink from "@/app/components/UploaderIdentityLink";
import AnalyticsEventTracker from "@/app/components/analytics/AnalyticsEventTracker";
import { logPageRenderMetric } from "@/server/observability/metrics";

export const dynamic = "force-dynamic";

function buildSearchHref(params: Record<string, string | null | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params || {})) {
    const normalized = typeof value === "string" ? value.trim() : "";
    if (!normalized) continue;
    search.set(key, normalized);
  }
  const query = search.toString();
  return query ? `/search?${query}` : "/search";
}

const chipLinkClass =
  "rounded-full border border-gray-200 px-2 py-1 transition hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900";
const nsfwChipLinkClass =
  "rounded-full border border-amber-200 px-2 py-1 text-[11px] text-amber-800 transition hover:bg-amber-50 dark:border-amber-900 dark:text-amber-200 dark:hover:bg-amber-950/40";
const deviantChipLinkClass =
  "rounded-full border border-fuchsia-200 px-2 py-1 text-[11px] text-fuchsia-800 transition hover:bg-fuchsia-50 dark:border-fuchsia-900 dark:text-fuchsia-200 dark:hover:bg-fuchsia-950/40";

export default async function WorkPage({ params: paramsPromise }: { params: Promise<{ slug: string }> }) {
  const startedAt = Date.now();
  let slug = "";

  try {
    const params = await paramsPromise;
    slug = params.slug;

    const data = await getWorkPageDataBySlug(params.slug);
    if (!data.ok) return notFound();

    const work = data.work;
    const gated = !!data.gated;
    const viewer = data.viewer;
    const interactions = (data as any).interactions || { liked: false, bookmarked: false, myRating: null };
    const progress = (data as any).progress || { lastReadChapterId: null, lastReadChapterNumber: null };
    const canViewMature = !!viewer?.canViewMature;
    const canViewDeviantLove = !!viewer?.canViewDeviantLove;
    const gateReason = (data as any).gateReason as string | undefined;

    if (gated) {
      const isDeviant = gateReason === "DEVIANT_LOVE" || gateReason === "BOTH";
      return (
        <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
          <div className="max-w-4xl mx-auto px-4 py-10">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white/70 dark:border-gray-800 dark:bg-gray-900/50">
              <div className="p-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-black/70 px-3 py-1 text-xs text-white">
                  {isDeviant ? <LockLabel text="Deviant Love" /> : "18+ Mature Content"}
                </div>
                <h1 className="mt-3 text-2xl font-extrabold tracking-tight md:text-3xl">{work.title}</h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  {isDeviant
                    ? "Karya ini ditandai Deviant Love. Untuk membaca, kamu perlu unlock 18+ dan unlock Deviant Love di Settings."
                    : "Karya ini ditandai 18+. Untuk membaca, kamu perlu unlock + opt-in di Settings."}
                </p>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Link href="/settings/account" className="rounded-xl bg-purple-600 px-4 py-2 font-semibold text-white hover:brightness-110">
                    {isDeviant ? "Buka Settings (unlock 18+ + Deviant Love)" : "Buka Settings (unlock + opt-in 18+)"}
                  </Link>
                </div>

                {work.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={work.coverImage} alt={work.title} className="mt-6 w-full max-w-sm border border-gray-200 blur-md dark:border-gray-800" />
                ) : null}

                {viewer && (isDeviant ? !canViewDeviantLove : !canViewMature) ? (
                  <div className="mt-3 text-xs text-gray-600 dark:text-gray-300">
                    {isDeviant
                      ? "Deviant Love locked. Pastikan kamu sudah centang 18+ lalu unlock Deviant Love."
                      : 'NSFW locked. Pastikan kamu sudah centang "I am 18+" dan aktifkan "Include mature content".'}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </main>
      );
    }

    const [reviewRes, initialReadingLists, commentsRes] = await Promise.all([
      listWorkReviews({ workId: work.id, sort: "helpful", take: 30 }),
      viewer ? listReadingListOptionsForViewer() : Promise.resolve(null),
      fetchComments({
        scope: "workChapters",
        workId: work.id,
        take: 100,
        sort: "top",
      }),
    ]);

    const initialReviews = reviewRes.status === 200 ? ((reviewRes as any).body?.reviews || []) as any[] : undefined;
    const initialMyReviewId = reviewRes.status === 200 ? (((reviewRes as any).body?.myReviewId as string | null) || null) : null;
    const initialComments = commentsRes.status === 200 ? ((commentsRes as any).body?.comments || []) as any[] : undefined;
    const initialCanModerate = commentsRes.status === 200 ? !!((commentsRes as any).body?.canModerate) : false;

    const combinedWarnings = Array.isArray(work.warningTags) ? work.warningTags : [];
    const deviantLoveTags = Array.isArray(work.deviantLoveTags) ? work.deviantLoveTags : [];

    return (
      <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
        <AnalyticsEventTracker
          eventType="WORK_VIEW"
          payload={{
            path: `/w/${work.slug}`,
            routeName: "work.detail",
            workId: work.id,
            ownerUserId: work.authorId,
            workType: work.type,
            publishType: work.publishType,
            comicType: work.comicType,
            workOrigin: work.origin,
            translationLanguage: work.language,
            isMature: !!work.isMature,
            isDeviantLove: Array.isArray(work.deviantLoveTags) && work.deviantLoveTags.length > 0,
            genreIds: Array.isArray(work.genres) ? work.genres.map((genre: any) => genre.id).filter(Boolean) : [],
          }}
        />
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[280px_1fr]">
            <div>
              <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white/70 dark:border-gray-800 dark:bg-gray-900/50">
                <div className="relative aspect-[3/4] overflow-hidden rounded-[28px] bg-gray-100 dark:bg-gray-800">
                  {work.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={work.coverImage} alt={work.title} className="h-full w-full object-cover" />
                  ) : null}

                  <WorkCoverBadges
                    work={{
                      type: work.type,
                      publishType: work.publishType,
                      isMature: !!work.isMature,
                      language: work.language,
                      comicType: work.comicType,
                      updatedAt: work.updatedAt,
                    }}
                  />
                </div>
                <div className="p-4">
                  <UploaderIdentityLink user={work.author} className="w-full" textClassName="text-sm text-gray-600 dark:text-gray-300 font-medium" avatarClassName="h-8 w-8" />
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <Link href={buildSearchHref({ kind: String(work.type || "").toLowerCase() })} className={chipLinkClass}>
                      {work.type}
                    </Link>
                    <Link href={buildSearchHref({ completion: String(work.completion || "") })} className={chipLinkClass}>
                      {work.completion}
                    </Link>
                    {work.language ? (
                      <Link href={buildSearchHref({ lang: String(work.language).toLowerCase() })} className={chipLinkClass}>
                        {String(work.language).toUpperCase()}
                      </Link>
                    ) : null}
                    {work.isMature ? (
                      <Link href={buildSearchHref({ mature: "only" })} className="rounded-full bg-black/70 px-2 py-1 text-white transition hover:bg-black/85">
                        18+
                      </Link>
                    ) : null}
                  </div>

                  {combinedWarnings.length ? (
                    <div className="mt-3">
                      <div className="text-xs font-semibold text-amber-800 dark:text-amber-200">NSFW</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {combinedWarnings.map((t: any) => (
                          <Link
                            key={t.slug}
                            href={buildSearchHref({ wi: t.slug })}
                            className={nsfwChipLinkClass}
                          >
                            {t.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {deviantLoveTags.length ? (
                    <div className="mt-3">
                      <div className="text-xs font-semibold text-fuchsia-800 dark:text-fuchsia-200">Deviant Love</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {deviantLoveTags.map((t: any) => (
                          <Link
                            key={t.slug}
                            href={buildSearchHref({ di: t.slug })}
                            className={deviantChipLinkClass}
                          >
                            {t.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {Array.isArray(work.genres) && work.genres.length ? (
                    <div className="mt-4">
                      <div className="text-xs font-semibold">Genres</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {work.genres.slice(0, 18).map((g: any) => (
                          <Link
                            key={g.slug}
                            href={`/search?genre=${g.slug}`}
                            className={`${chipLinkClass} text-[11px]`}
                          >
                            {g.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {Array.isArray(work.tags) && work.tags.length ? (
                    <div className="mt-4">
                      <div className="text-xs font-semibold">Tags</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {work.tags.slice(0, 24).map((t: any) => (
                          <Link
                            key={t.slug}
                            href={`/search?tag=${encodeURIComponent(t.name)}`}
                            className={`${chipLinkClass} text-[11px]`}
                          >
                            #{t.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div>
              <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{work.title}</h1>

              <div className="-mx-1 mt-4 hidden items-center gap-2 overflow-x-auto px-1 pb-1 md:flex md:flex-wrap md:overflow-visible">
                <LikeButton workId={work.id} initialLiked={!!interactions.liked} initialCount={Number(work.likeCount ?? 0)} />
                <BookmarkButton workId={work.id} initialBookmarked={!!interactions.bookmarked} />
                <AddToListButton workId={work.id} initialLists={initialReadingLists as any} />
                <ShareButton title={work.title} />
                <RatingStars
                  workId={work.id}
                  initialMyRating={typeof interactions.myRating === "number" ? interactions.myRating : null}
                  ratingAvg={Number(work.ratingAvg ?? 0)}
                  ratingCount={Number(work.ratingCount ?? 0)}
                />
              </div>

              <div className="mt-4 grid gap-2 md:hidden">
                <div className="grid grid-cols-3 gap-2">
                  <LikeButton className="w-full px-3" workId={work.id} initialLiked={!!interactions.liked} initialCount={Number(work.likeCount ?? 0)} />
                  <BookmarkButton className="w-full px-3" workId={work.id} initialBookmarked={!!interactions.bookmarked} />
                  <AddToListButton className="w-full px-3" workId={work.id} initialLists={initialReadingLists as any} />
                </div>
                <div className="grid grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] gap-2">
                  <ShareButton className="w-full min-w-0 px-3" title={work.title} />
                  <RatingStars
                    className="w-full min-w-0 px-3"
                    workId={work.id}
                    initialMyRating={typeof interactions.myRating === "number" ? interactions.myRating : null}
                    ratingAvg={Number(work.ratingAvg ?? 0)}
                    ratingCount={Number(work.ratingCount ?? 0)}
                  />
                </div>
              </div>

              {work.description ? <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-200">{work.description}</p> : null}

              <div className="mt-6">
                <WorkInfoPanel work={work} />
              </div>

              <div className="mt-6">
                <ContentWarningsGate storageKey={`work:${work.id}`} title={work.title} warnings={combinedWarnings}>
                  <div className="grid gap-3">
                    <SeriesArcsPanel
                      currentWorkId={work.id}
                      currentWorkSlug={work.slug}
                      currentWorkTitle={work.title}
                      currentWorkCoverImage={work.coverImage}
                      currentWorkSeriesOrder={work.seriesOrder}
                      currentWorkType={work.type}
                      currentWorkComicType={work.comicType}
                      currentWorkPublishType={work.publishType}
                      currentWorkIsMature={work.isMature}
                      currentWorkLanguage={work.language}
                      currentWorkCompletion={work.completion}
                      currentWorkChapterCount={work.chapterCount}
                      currentWorkChapterLoveCount={work.chapterLoveCount}
                      currentWorkRatingAvg={work.ratingAvg}
                      currentWorkRatingCount={work.ratingCount}
                      currentWorkUpdatedAt={work.updatedAt}
                      currentWorkGenres={work.genres}
                      currentWorkDeviantLoveTags={work.deviantLoveTags}
                      currentWorkAuthor={work.author}
                      currentWorkTranslator={work.translator}
                      seriesTitle={work.seriesTitle}
                      works={Array.isArray(work.seriesWorks) ? work.seriesWorks : []}
                      previousArc={work.previousArc}
                      nextArc={work.nextArc}
                    />

                    <WorkChaptersWebtoon
                      slug={work.slug}
                      chapters={Array.isArray(work.chapters) ? work.chapters : []}
                      lastReadChapterId={typeof progress?.lastReadChapterId === "string" ? progress.lastReadChapterId : null}
                      limit={5}
                      showAllHref={Array.isArray(work.chapters) && work.chapters.length > 5 ? `/w/${work.slug}/chapters` : null}
                    />
                  </div>
                </ContentWarningsGate>
              </div>

              <ReviewSection
                workId={work.id}
                ratingAvg={Number(work.ratingAvg ?? 0)}
                ratingCount={Number(work.ratingCount ?? 0)}
                initialMyRating={typeof interactions.myRating === "number" ? interactions.myRating : null}
                initialReviews={initialReviews as any}
                initialMyReviewId={initialMyReviewId}
              />

              <CommentSection
                targetType="CHAPTER"
                targetId={work.id}
                title="Comments"
                scope="workChapters"
                showComposer={false}
                sort="top"
                showChapterContext
                initialComments={initialComments as any}
                initialCanModerate={initialCanModerate}
              />
            </div>
          </div>
        </div>
      </main>
    );
  } finally {
    logPageRenderMetric("work.detail", startedAt, { slug });
  }
}

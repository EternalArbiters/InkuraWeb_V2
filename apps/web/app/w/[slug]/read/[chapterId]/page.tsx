import Link from "next/link";
import ComicPageStack from "@/app/components/reader/ComicPageStack";
import { notFound, redirect } from "next/navigation";
import ContentWarningsGate from "@/components/ContentWarningsGate";
import { getPublishedChapterReaderData } from "@/server/services/chapters/readChapter";
import { fetchComments } from "@/server/services/comments/fetchComments";
import LockLabel from "@/app/components/LockLabel";
import CommentSection from "@/app/components/work/CommentSection";
import ReaderChrome from "@/app/components/reader/ReaderChrome";
import DesktopReaderDock from "@/app/components/reader/DesktopReaderDock";
import CreatorNoteCard from "@/app/components/reader/CreatorNoteCard";
import ReaderFloatingSeed from "@/app/components/reader/ReaderFloatingSeed";
import ProtectedNovelContent from "@/app/components/reader/ProtectedNovelContent";
import { getNovelReaderHtml } from "@/lib/novelContent";
import AnalyticsEventTracker from "@/app/components/analytics/AnalyticsEventTracker";
import { logPageRenderMetric } from "@/server/observability/metrics";
import { getActiveUILanguageText } from "@/server/services/uiLanguage/runtime";

export const dynamic = "force-dynamic";

function chapterLabel(n: number, title: string) {
  const t = title ? `: ${title}` : "";
  return `Ch. ${n}${t}`;
}

export default async function ReadChapterPage({
  params: paramsPromise,
}: {
  params: Promise<{ slug: string; chapterId: string }>;
}) {
  const startedAt = Date.now();
  let slug = "";
  let chapterId = "";

  try {
    const params = await paramsPromise;
    slug = params.slug;
    chapterId = params.chapterId;

    const data = await getPublishedChapterReaderData(params.chapterId);
  if (!data.ok) return notFound();

  const { gated, chapter, work } = data;
  const gateReason = (data as any).gateReason as string | undefined;

  if (!work || !chapter) return notFound();

  if (work.slug && work.slug !== params.slug) {
    redirect(`/w/${work.slug}/read/${params.chapterId}`);
  }

  if (gated) {
    const isDeviant = gateReason === "DEVIANT_LOVE" || gateReason === "BOTH";
    const [matureLabel, deviantMessage, matureMessage, openDeviantSettingsLabel, openMatureSettingsLabel, backToWorkLabel] = await Promise.all([
      getActiveUILanguageText("18+ Mature Content", { section: "Page Work Detail" }),
      getActiveUILanguageText("This chapter is marked as Deviant Love. To read it, you need to unlock 18+ and Deviant Love in Settings.", { section: "Page Reader" }),
      getActiveUILanguageText("This chapter is marked 18+. To read it, you need to unlock it and opt in under Settings.", { section: "Page Reader" }),
      getActiveUILanguageText("Open Settings (unlock 18+ + Deviant Love)", { section: "Page Reader" }),
      getActiveUILanguageText("Open Settings (unlock + opt in to 18+)", { section: "Page Reader" }),
      getActiveUILanguageText("Back to work", { section: "Page Reader" }),
    ]);
    return (
      <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6">
            <div className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-black/70 text-white">
              {isDeviant ? <LockLabel text="Deviant Love" /> : matureLabel}
            </div>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight">{work.title}</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              {isDeviant
                ? deviantMessage
                : matureMessage}
            </p>
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <Link
                href="/settings/account"
                className="px-4 py-2 rounded-xl bg-purple-600 text-white font-semibold hover:brightness-110"
              >
                {isDeviant ? openDeviantSettingsLabel : openMatureSettingsLabel}
              </Link>
              <Link
                href={`/w/${work.slug}`}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 font-semibold"
              >
                {backToWorkLabel}
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const initialCommentsRes = await fetchComments({
    targetType: "CHAPTER",
    targetId: chapter.id,
    take: 5,
    sort: "top",
  });
  const initialComments = initialCommentsRes.status === 200 ? ((((initialCommentsRes as any).body?.comments || []) as any[])) : undefined;
  const initialCanModerate = initialCommentsRes.status === 200 ? !!((initialCommentsRes as any).body?.canModerate) : false;

  const allWarnings = [...(work.warningTags || []), ...(chapter.warningTags || [])].reduce((acc: any[], w: any) => {
    if (!acc.some((x) => x.slug === w.slug)) acc.push(w);
    return acc;
  }, [] as any[]);

  const chapterIdx = Array.isArray(work.chapters) ? work.chapters.findIndex((c: any) => c.id === chapter.id) : -1;
  const prev = chapterIdx > 0 ? work.chapters[chapterIdx - 1] : null;
  const next = chapterIdx >= 0 && chapterIdx < work.chapters.length - 1 ? work.chapters[chapterIdx + 1] : null;

  const isComic = work.type === "COMIC";
  const novelHtml = isComic ? "" : getNovelReaderHtml(chapter.text?.content);
  const [commentsTitle, seeAllCommentsLabel, backToNovelLabel] = await Promise.all([
    getActiveUILanguageText("Comments", { section: "Page Reader Comments" }),
    getActiveUILanguageText("See all comments", { section: "Page Reader" }),
    getActiveUILanguageText("Back to novel", { section: "Page Reader" }),
  ]);

  const mobileReaderFooter = (
    <>
      <div className="mt-6">
        <CreatorNoteCard
          uploader={(work as any).author || { username: null, name: null, image: null }}
          translator={(work as any).translator || null}
          publishType={(work as any).publishType || null}
          note={(chapter as any).authorNote || null}
        />
      </div>

      <CommentSection
        targetType="CHAPTER"
        targetId={chapter.id}
        title={commentsTitle}
        take={5}
        showComposer={true}
        sort="top"
        variant="compact"
        initialComments={initialComments as any}
        initialCanModerate={initialCanModerate}
      />
      <div className="mt-3 flex items-center justify-center">
        <Link
          href={`/w/${work.slug}/read/${chapter.id}/comments`}
          className="w-full text-center rounded-full px-5 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
        >
          {seeAllCommentsLabel}
        </Link>
      </div>
    </>
  );

  const mobileSlideEndingContent = !isComic ? (
    <div className="space-y-5 pb-6">
      {mobileReaderFooter}
      <div className="flex items-center justify-center pt-2">
        <Link
          href={`/w/${work.slug}`}
          className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-5 py-3 text-sm font-extrabold text-white shadow-[0_18px_40px_-24px_rgba(168,85,247,0.9)]"
        >
          {backToNovelLabel}
        </Link>
      </div>
    </div>
  ) : null;

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <AnalyticsEventTracker
        eventType="CHAPTER_VIEW"
        payload={{
          path: `/w/${work.slug}/read/${chapter.id}`,
          routeName: "chapter.read",
          workId: work.id,
          chapterId: chapter.id,
          ownerUserId: work.authorId,
          workType: work.type,
          publishType: work.publishType,
          comicType: work.comicType,
          workOrigin: work.origin,
          translationLanguage: work.language,
          isMature: !!(chapter.isMature || work.isMature),
          isDeviantLove: Array.isArray(work.deviantLoveTags) && work.deviantLoveTags.length > 0,
          genreIds: Array.isArray(work.genres) ? work.genres.map((genre: any) => genre.id).filter(Boolean) : [],
        }}
      />
      {/* Desktop dock (Pre / All / Next) */}
      <DesktopReaderDock workSlug={work.slug} prevId={prev ? prev.id : null} nextId={next ? next.id : null} />
      <ReaderFloatingSeed
        chapterId={chapter.id}
        initialLiked={!!(chapter as any).viewerLiked}
        initialLikeCount={typeof (chapter as any).likeCount === "number" ? (chapter as any).likeCount : 0}
      />

      <div className="mx-auto max-w-6xl px-0 sm:px-4 py-0 lg:py-8 pb-24">
        <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-8">
          <div>
            {/* keep for accessibility/SEO only */}
            <h1 className="sr-only">{work.title} — {chapterLabel(chapter.number, chapter.title)}</h1>

            {/* Desktop titles */}
            <div className="hidden lg:block mb-4">
              <Link href={`/w/${work.slug}`} className="block text-sm text-white/60 hover:text-white truncate">
                {work.title}
              </Link>
              <div className="mt-1 text-3xl font-extrabold tracking-tight text-white">
                {chapterLabel(chapter.number, chapter.title)}
              </div>
            </div>

            <div className="mt-0">
              <ContentWarningsGate
                storageKey={`chapter:${chapter.id}`}
                title={`${work.title} — ${chapterLabel(chapter.number, chapter.title)}`}
                warnings={allWarnings}
              >
                <ReaderChrome
                  workId={work.id}
                  workSlug={work.slug}
                  workTitle={work.title}
                  chapterTitle={chapterLabel(chapter.number, chapter.title)}
                  chapterId={chapter.id}
                  prevId={prev ? prev.id : null}
                  nextId={next ? next.id : null}
                  initialLiked={!!(chapter as any).viewerLiked}
                  initialLikeCount={typeof (chapter as any).likeCount === "number" ? (chapter as any).likeCount : 0}
                  readerType={isComic ? "COMIC" : "NOVEL"}
                >
                  {isComic ? (
                    Array.isArray(chapter.pages) && chapter.pages.length > 0 ? (
                      <ComicPageStack pages={chapter.pages as any} />
                    ) : (
                      <div className="mx-4 lg:mx-0 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6">
                        <div className="text-lg font-bold">{await getActiveUILanguageText("No pages yet", { section: "Page Reader" })}</div>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                          {await getActiveUILanguageText("This chapter has no pages yet. (Creators can upload them via Studio.)", { section: "Page Reader" })}
                        </p>
                      </div>
                    )
                  ) : (
                    novelHtml ? (
                      <ProtectedNovelContent html={novelHtml} slideEndingContent={mobileSlideEndingContent} />
                    ) : (
                      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6 mx-4 lg:mx-0">
                        <div className="text-lg font-bold">{await getActiveUILanguageText("No text yet", { section: "Page Reader" })}</div>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{await getActiveUILanguageText("This chapter has no text yet.", { section: "Page Reader" })}</p>
                      </div>
                    )
                  )}
                </ReaderChrome>
              </ContentWarningsGate>
            </div>

            <style jsx global>{`
              @media (max-width: 1023px) {
                html[data-reader-mode="slide"] [data-mobile-reader-footer="chapter-reader"] {
                  display: none !important;
                }
              }
            `}</style>

            {/* Mobile: preview only (top 5) */}
            <div data-mobile-reader-footer="chapter-reader" className="lg:hidden px-4">
              {mobileReaderFooter}
            </div>
          </div>

          {/* Desktop: side comments */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <div className="mb-4">
                <CreatorNoteCard
                  uploader={(work as any).author || { username: null, name: null, image: null }}
                  translator={(work as any).translator || null}
                  publishType={(work as any).publishType || null}
                  note={(chapter as any).authorNote || null}
                />
              </div>

              <CommentSection
                targetType="CHAPTER"
                targetId={chapter.id}
                title={commentsTitle}
                take={5}
                showComposer={true}
                sort="top"
                variant="compact"
                initialComments={initialComments as any}
                initialCanModerate={initialCanModerate}
              />
              <div className="mt-3 flex items-center justify-center">
                <Link
                  href={`/w/${work.slug}/read/${chapter.id}/comments`}
                  className="w-full text-center rounded-full px-5 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  {seeAllCommentsLabel}
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
  } finally {
    logPageRenderMetric("chapter.reader", startedAt, { slug, chapterId });
  }
}

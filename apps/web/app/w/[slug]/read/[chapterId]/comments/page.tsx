import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPublishedChapterReaderData } from "@/server/services/chapters/readChapter";
import { fetchComments } from "@/server/services/comments/fetchComments";
import { getActiveUILanguageText } from "@/server/services/uiLanguage/runtime";
import LockLabel from "@/app/components/LockLabel";
import CommentSection from "@/app/components/work/CommentSection";
import ReaderFloatingSeed from "@/app/components/reader/ReaderFloatingSeed";
import { getChapterDisplayTitle } from "@/lib/chapterLabel";

export const dynamic = "force-dynamic";

function safeSort(v: unknown): "latest" | "top" | "oldest" {
  const s = String(v || "").toLowerCase().trim();
  if (s === "top") return "top";
  if (s === "oldest" || s === "bottom") return "oldest";
  return "latest";
}

export default async function ChapterCommentsPage({
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: {
  params: Promise<{ slug: string; chapterId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await paramsPromise;
  const searchParams = (await searchParamsPromise) || {};
  const sort = safeSort((searchParams as any)?.sort);

  const data = await getPublishedChapterReaderData(params.chapterId);
  if (!data.ok) return notFound();

  const { gated, chapter, work } = data;
  const gateReason = (data as any).gateReason as string | undefined;
  if (!work || !chapter) return notFound();

  if (work.slug && work.slug !== params.slug) {
    redirect(`/w/${work.slug}/read/${params.chapterId}/comments?sort=${sort}`);
  }

  if (gated) {
    const isDeviant = gateReason === "DEVIANT_LOVE" || gateReason === "BOTH";
    const [matureLabel, deviantMessage, matureMessage, openDeviantSettingsLabel, openMatureSettingsLabel, backToReaderLabel] = await Promise.all([
      getActiveUILanguageText("18+ Mature Content", { section: "Page Work Detail" }),
      getActiveUILanguageText("This chapter is marked as Deviant Love. To read and comment, you need to unlock 18+ and Deviant Love in Settings.", { section: "Page Reader Comments" }),
      getActiveUILanguageText("This chapter is marked 18+. To read and comment, you need to unlock it and opt in under Settings.", { section: "Page Reader Comments" }),
      getActiveUILanguageText("Open Settings (unlock 18+ + Deviant Love)", { section: "Page Reader" }),
      getActiveUILanguageText("Open Settings (unlock + opt in to 18+)", { section: "Page Reader" }),
      getActiveUILanguageText("Back to reader", { section: "Page Reader Comments" }),
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
              {isDeviant ? deviantMessage : matureMessage}
            </p>
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <Link href="/settings/account" className="px-4 py-2 rounded-xl bg-purple-600 text-white font-semibold hover:brightness-110">
                {isDeviant ? openDeviantSettingsLabel : openMatureSettingsLabel}
              </Link>
              <Link
                href={`/w/${work.slug}/read/${chapter.id}`}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 font-semibold"
              >
                {backToReaderLabel}
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const commentsRes = await fetchComments({
    targetType: "CHAPTER",
    targetId: chapter.id,
    take: 100,
    sort,
  });
  const initialComments = commentsRes.status === 200 ? ((((commentsRes as any).body?.comments || []) as any[])) : undefined;
  const initialCanModerate = commentsRes.status === 200 ? !!((commentsRes as any).body?.canModerate) : false;

  const seededLikeCount = typeof (chapter as any).likeCount === "number" ? (chapter as any).likeCount : 0;
  const [goToWorkPageTitle, backToReaderTitle, commentsTitle] = await Promise.all([
    getActiveUILanguageText("Go to work page", { section: "Page Reader Comments" }),
    getActiveUILanguageText("Back to reader", { section: "Page Reader Comments" }),
    getActiveUILanguageText("Comments", { section: "Page Reader Comments" }),
  ]);

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <ReaderFloatingSeed
        chapterId={chapter.id}
        initialLiked={!!(chapter as any).viewerLiked}
        initialLikeCount={seededLikeCount}
      />
      <div className="max-w-3xl mx-auto px-4 py-8 pb-24">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/w/${work.slug}`}
              className="block truncate text-sm text-gray-600 dark:text-gray-300 font-semibold hover:text-gray-900 dark:hover:text-white"
              title={goToWorkPageTitle}
            >
              {work.title}
            </Link>
            <Link
              href={`/w/${work.slug}/read/${chapter.id}`}
              className="mt-1 block truncate text-2xl font-extrabold tracking-tight hover:underline"
              title={backToReaderTitle}
            >
              {getChapterDisplayTitle(chapter.number, chapter.title, chapter.label, { short: true })}
            </Link>
          </div>
        </div>

        <CommentSection
          targetType="CHAPTER"
          targetId={chapter.id}
          title={commentsTitle}
          sort={sort}
          variant="plain"
          initialComments={initialComments as any}
          initialCanModerate={initialCanModerate}
        />
      </div>
    </main>
  );
}

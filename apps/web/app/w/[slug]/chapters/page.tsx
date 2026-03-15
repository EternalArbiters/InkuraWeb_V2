import BackButton from "@/app/components/BackButton";
import { notFound } from "next/navigation";
import WorkChaptersWebtoon from "@/app/components/work/WorkChaptersWebtoon";
import { getActiveUILanguageText } from "@/server/services/uiLanguage/runtime";
import { getWorkPageDataBySlug } from "@/server/services/works/workPage";

export const dynamic = "force-dynamic";

export default async function WorkAllChaptersPage({ params: paramsPromise }: { params: Promise<{ slug: string }> }) {
  const params = await paramsPromise;

  const data = await getWorkPageDataBySlug(params.slug);
  if (!data.ok) return notFound();
  const tAllChapters = await getActiveUILanguageText("All Chapters");

  const work = data.work;
  const progress = (data as any).progress || { lastReadChapterId: null, lastReadChapterNumber: null };

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-3xl font-extrabold tracking-tight">{tAllChapters}</div>
            <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">{work.title}</div>
          </div>
          <BackButton href={`/w/${work.slug}`} />
        </div>

        <WorkChaptersWebtoon
          slug={work.slug}
          chapters={Array.isArray(work.chapters) ? work.chapters : []}
          lastReadChapterId={typeof progress?.lastReadChapterId === "string" ? progress.lastReadChapterId : null}
          limit={null}
          showAllHref={null}
        />
      </div>
    </main>
  );
}

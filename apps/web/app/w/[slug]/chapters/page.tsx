import Link from "next/link";
import { notFound } from "next/navigation";
import WorkChaptersWebtoon from "@/app/components/work/WorkChaptersWebtoon";
import { getWorkPageDataBySlug } from "@/server/services/works/workPage";

export const dynamic = "force-dynamic";

export default async function WorkAllChaptersPage({ params: paramsPromise }: { params: Promise<{ slug: string }> }) {
  const params = await paramsPromise;

  const data = await getWorkPageDataBySlug(params.slug);
  if (!data.ok) return notFound();

  const work = data.work;
  const progress = (data as any).progress || { lastReadChapterNumber: null };

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-3xl font-extrabold tracking-tight">All Chapters</div>
            <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">{work.title}</div>
          </div>
          <Link
            href={`/w/${work.slug}`}
            className="inline-flex items-center justify-center rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900"
          >
            Back
          </Link>
        </div>

        <WorkChaptersWebtoon
          slug={work.slug}
          chapters={Array.isArray(work.chapters) ? work.chapters : []}
          lastReadChapterNumber={typeof progress?.lastReadChapterNumber === "number" ? progress.lastReadChapterNumber : null}
          showAllHref={null}
        />
      </div>
    </main>
  );
}

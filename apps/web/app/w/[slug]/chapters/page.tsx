import Link from "next/link";
import { notFound } from "next/navigation";
import WorkChaptersWebtoon from "@/app/components/work/WorkChaptersWebtoon";
import { apiJson } from "@/server/http/apiJson";

export const dynamic = "force-dynamic";

export default async function WorkAllChaptersPage({ params: paramsPromise }: { params: Promise<{ slug: string }> }) {
  const params = await paramsPromise;

  const res = await apiJson<{ work: any; gated: boolean; viewer: any; interactions?: any }>(`/api/works/slug/${params.slug}`);
  if (!res.ok) return notFound();

  const work = res.data.work;
  const gated = !!res.data.gated;
  const progress = (res.data as any).progress || { lastReadChapterNumber: null };

  if (gated) return notFound();

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Link
            href={`/w/${work.slug}`}
            className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900"
          >
            Back to Work
          </Link>
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">All Chapters</div>
            <h1 className="truncate text-2xl font-extrabold md:text-3xl">{work.title}</h1>
          </div>
        </div>

        <WorkChaptersWebtoon
          slug={work.slug}
          chapters={Array.isArray(work.chapters) ? work.chapters : []}
          lastReadChapterNumber={typeof progress?.lastReadChapterNumber === "number" ? progress.lastReadChapterNumber : null}
        />
      </div>
    </main>
  );
}

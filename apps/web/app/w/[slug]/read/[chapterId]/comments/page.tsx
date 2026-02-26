import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { apiJson } from "@/lib/serverApi";
import LockLabel from "@/app/components/LockLabel";
import CommentSection from "@/app/components/work/CommentSection";

export const dynamic = "force-dynamic";

function chapterLabel(n: number, title: string) {
  const t = title ? `: ${title}` : "";
  return `Ch. ${n}${t}`;
}

function safeSort(v: unknown): "new" | "top" {
  const s = String(v || "").toLowerCase().trim();
  return s === "top" ? "top" : "new";
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

  const res = await apiJson<{ gated: boolean; chapter: any; work: any; viewer: any; gateReason?: string }>(`/api/chapters/${params.chapterId}`);
  if (!res.ok) return notFound();

  const { gated, chapter, work } = res.data;
  const gateReason = (res.data as any).gateReason as string | undefined;
  if (!work || !chapter) return notFound();

  if (work.slug && work.slug !== params.slug) {
    redirect(`/w/${work.slug}/read/${params.chapterId}/comments?sort=${sort}`);
  }

  if (gated) {
    const isDeviant = gateReason === "DEVIANT_LOVE" || gateReason === "BOTH";
    return (
      <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6">
            <div className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-black/70 text-white">
              {isDeviant ? <LockLabel text="Deviant Love" /> : "18+ Mature Content"}
            </div>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight">{work.title}</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              {isDeviant
                ? "Chapter ini ditandai Deviant Love. Untuk baca & komen, kamu perlu unlock 18+ dan unlock Deviant Love di Settings."
                : "Chapter ini ditandai 18+. Untuk baca & komen, kamu perlu unlock + opt-in di Settings."}
            </p>
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <Link href="/settings/account" className="px-4 py-2 rounded-xl bg-purple-600 text-white font-semibold hover:brightness-110">
                {isDeviant ? "Buka Settings (unlock 18+ + Deviant Love)" : "Buka Settings (unlock + opt-in 18+)"}
              </Link>
              <Link
                href={`/w/${work.slug}/read/${chapter.id}`}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 font-semibold"
              >
                Back to reader
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-3xl mx-auto px-4 py-8 pb-24">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm text-gray-600 dark:text-gray-300 font-semibold truncate">{work.title}</div>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight truncate">{chapterLabel(chapter.number, chapter.title)}</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/w/${work.slug}/read/${chapter.id}`}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 text-sm font-semibold"
            >
              Back
            </Link>
            <Link
              href={`/w/${work.slug}`}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 text-sm font-semibold"
            >
              Menu
            </Link>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Link
            href={`/w/${work.slug}/read/${chapter.id}/comments?sort=new`}
            className={`rounded-full px-4 py-2 text-sm font-semibold border ${
              sort === "new"
                ? "border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-500/40 dark:bg-purple-950/25 dark:text-purple-200"
                : "border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
            }`}
          >
            New
          </Link>
          <Link
            href={`/w/${work.slug}/read/${chapter.id}/comments?sort=top`}
            className={`rounded-full px-4 py-2 text-sm font-semibold border ${
              sort === "top"
                ? "border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-500/40 dark:bg-purple-950/25 dark:text-purple-200"
                : "border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
            }`}
          >
            Top
          </Link>        </div>

        <CommentSection targetType="CHAPTER" targetId={chapter.id} title="Comments" sort={sort} />
      </div>
    </main>
  );
}

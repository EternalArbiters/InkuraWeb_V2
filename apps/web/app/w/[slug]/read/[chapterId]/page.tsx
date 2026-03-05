import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ContentWarningsGate from "@/components/ContentWarningsGate";
import { apiJson } from "@/server/http/apiJson";
import LockLabel from "@/app/components/LockLabel";
import CommentSection from "@/app/components/work/CommentSection";
import ReaderChrome from "@/app/components/reader/ReaderChrome";
import DesktopReaderDock from "@/app/components/reader/DesktopReaderDock";
import CreatorNoteCard from "@/app/components/reader/CreatorNoteCard";

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
  const params = await paramsPromise;

  const res = await apiJson<{ gated: boolean; chapter: any; work: any; viewer: any; gateReason?: string }>(
    `/api/chapters/${params.chapterId}`
  );
  if (!res.ok) return notFound();

  const { gated, chapter, work } = res.data;
  const gateReason = (res.data as any).gateReason as string | undefined;

  if (!work || !chapter) return notFound();

  if (work.slug && work.slug !== params.slug) {
    redirect(`/w/${work.slug}/read/${params.chapterId}`);
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
                ? "Chapter ini ditandai Deviant Love. Untuk membaca, kamu perlu unlock 18+ dan unlock Deviant Love di Settings."
                : "Chapter ini ditandai 18+. Untuk membaca, kamu perlu unlock + opt-in di Settings."}
            </p>
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <Link
                href="/settings/account"
                className="px-4 py-2 rounded-xl bg-purple-600 text-white font-semibold hover:brightness-110"
              >
                {isDeviant ? "Buka Settings (unlock 18+ + Deviant Love)" : "Buka Settings (unlock + opt-in 18+)"}
              </Link>
              <Link
                href={`/w/${work.slug}`}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 font-semibold"
              >
                Back to work
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const allWarnings = [...(work.warningTags || []), ...(chapter.warningTags || [])].reduce((acc: any[], w: any) => {
    if (!acc.some((x) => x.slug === w.slug)) acc.push(w);
    return acc;
  }, [] as any[]);

  const chapterIdx = Array.isArray(work.chapters) ? work.chapters.findIndex((c: any) => c.id === chapter.id) : -1;
  const prev = chapterIdx > 0 ? work.chapters[chapterIdx - 1] : null;
  const next = chapterIdx >= 0 && chapterIdx < work.chapters.length - 1 ? work.chapters[chapterIdx + 1] : null;

  const isComic = work.type === "COMIC";

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      {/* Desktop dock (Pre / All / Next) */}
      <DesktopReaderDock workSlug={work.slug} prevId={prev ? prev.id : null} nextId={next ? next.id : null} />

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
                >
                  {isComic ? (
                    <div className="-mx-0 sm:-mx-0 lg:mx-0 flex flex-col gap-0">
                      {Array.isArray(chapter.pages)
                        ? chapter.pages.map((p: any) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={p.id} src={p.imageUrl} alt={`Page ${p.order}`} className="w-full block" />
                          ))
                        : null}

                      {Array.isArray(chapter.pages) && chapter.pages.length === 0 ? (
                        <div className="mx-4 lg:mx-0 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6">
                          <div className="text-lg font-bold">No pages yet</div>
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                            Chapter ini belum punya halaman. (Creator bisa upload via Studio.)
                          </p>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <article className="prose dark:prose-invert max-w-none px-4 lg:px-0">
                      {chapter.text?.content ? (
                        <div className="whitespace-pre-wrap leading-relaxed">{chapter.text.content}</div>
                      ) : (
                        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6">
                          <div className="text-lg font-bold">No text yet</div>
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Chapter ini belum punya teks.</p>
                        </div>
                      )}
                    </article>
                  )}
                </ReaderChrome>
              </ContentWarningsGate>
            </div>

            {/* Mobile: preview only (top 5) */}
            <div className="lg:hidden px-4">
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
                title="Comments"
                take={5}
                showComposer={true}
                sort="top"
                variant="compact"
              />
              <div className="mt-3 flex items-center justify-center">
                <Link
                  href={`/w/${work.slug}/read/${chapter.id}/comments`}
                  className="w-full text-center rounded-full px-5 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  See all comments
                </Link>
              </div>
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
                title="Comments"
                take={5}
                showComposer={true}
                sort="top"
                variant="compact"
              />
              <div className="mt-3 flex items-center justify-center">
                <Link
                  href={`/w/${work.slug}/read/${chapter.id}/comments`}
                  className="w-full text-center rounded-full px-5 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  See all comments
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

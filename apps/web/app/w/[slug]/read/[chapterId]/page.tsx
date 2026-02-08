import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import ContentWarningsGate from "@/components/ContentWarningsGate";

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
  const work = await prisma.work.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      slug: true,
      title: true,
      type: true,
      status: true,
      isMature: true,
      authorId: true,
      warningTags: { select: { name: true, slug: true } },
      chapters: {
        where: { status: "PUBLISHED" },
        orderBy: [{ number: "asc" }, { createdAt: "asc" }],
        select: { id: true, number: true, title: true },
      },
    },
  });

  if (!work || work.status !== "PUBLISHED") return notFound();

  const chapter = await prisma.chapter.findUnique({
    where: { id: params.chapterId },
    select: {
      id: true,
      workId: true,
      title: true,
      number: true,
      status: true,
      isMature: true,
      warningTags: { select: { name: true, slug: true } },
      text: { select: { content: true } },
      pages: { orderBy: { order: "asc" }, select: { id: true, imageUrl: true, order: true } },
    },
  });

  if (!chapter || chapter.workId !== work.id || chapter.status !== "PUBLISHED") return notFound();

  const session = await getServerSession(authOptions);
  const me = session?.user?.id
    ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, role: true, matureOptIn: true } })
    : null;

  const isOwner = !!me?.id && me.id === work.authorId;
  const canViewMature = isOwner || me?.role === "ADMIN" || !!me?.matureOptIn;

  const requiresMature = (work.isMature || chapter.isMature) && !canViewMature;

  if (requiresMature) {
    return (
      <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6">
            <div className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-black/70 text-white">
              18+ Mature Content
            </div>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight">{work.title}</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Chapter ini ditandai 18+. Untuk membaca, kamu perlu opt-in di Settings.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <Link
                href="/settings/account"
                className="px-4 py-2 rounded-xl bg-purple-600 text-white font-semibold hover:brightness-110"
              >
                Buka Settings (opt-in 18+)
              </Link>
              <Link
                href={`/w/${work.slug}`}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                Kembali ke Detail
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const allWarnings = [...work.warningTags, ...chapter.warningTags]
    .reduce((acc: any[], w) => {
      if (!acc.some((x) => x.slug === w.slug)) acc.push(w);
      return acc;
    }, [] as any[]);

  const chapterIdx = work.chapters.findIndex((c) => c.id === chapter.id);
  const prev = chapterIdx > 0 ? work.chapters[chapterIdx - 1] : null;
  const next = chapterIdx >= 0 && chapterIdx < work.chapters.length - 1 ? work.chapters[chapterIdx + 1] : null;

  const isComic = work.type === "COMIC";

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Link href={`/w/${work.slug}`} className="text-sm text-purple-600 dark:text-purple-400 hover:underline">
              ← {work.title}
            </Link>
            <h1 className="mt-2 text-2xl md:text-3xl font-extrabold tracking-tight">
              {chapterLabel(chapter.number, chapter.title)}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {prev ? (
              <Link
                href={`/w/${work.slug}/read/${prev.id}`}
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 text-sm"
              >
                ← Prev
              </Link>
            ) : null}
            {next ? (
              <Link
                href={`/w/${work.slug}/read/${next.id}`}
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 text-sm"
              >
                Next →
              </Link>
            ) : null}
          </div>
        </div>

        <div className="mt-6">
          <ContentWarningsGate storageKey={`chapter:${chapter.id}`} title={`${work.title} — ${chapterLabel(chapter.number, chapter.title)}`} warnings={allWarnings}>
            {isComic ? (
              <div className="grid gap-3">
                {chapter.pages.map((p) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={p.id} src={p.imageUrl} alt={`Page ${p.order}`} className="w-full rounded-2xl border border-gray-200 dark:border-gray-800" />
                ))}
                {chapter.pages.length === 0 ? (
                  <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6">
                    <div className="text-lg font-bold">No pages yet</div>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                      Chapter ini belum punya halaman. (Creator bisa upload via Studio.)
                    </p>
                  </div>
                ) : null}
              </div>
            ) : (
              <article className="prose dark:prose-invert max-w-none">
                {chapter.text?.content ? (
                  <div className="whitespace-pre-wrap leading-relaxed">{chapter.text.content}</div>
                ) : (
                  <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6">
                    <div className="text-lg font-bold">No text yet</div>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                      Chapter ini belum punya teks.
                    </p>
                  </div>
                )}
              </article>
            )}
          </ContentWarningsGate>
        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          <Link href={`/w/${work.slug}`} className="text-sm text-purple-600 dark:text-purple-400 hover:underline">
            ← Back to detail
          </Link>
          <div className="flex items-center gap-2">
            {prev ? (
              <Link
                href={`/w/${work.slug}/read/${prev.id}`}
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 text-sm"
              >
                ← Prev
              </Link>
            ) : null}
            {next ? (
              <Link
                href={`/w/${work.slug}/read/${next.id}`}
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 text-sm"
              >
                Next →
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}

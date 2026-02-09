import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(`/library`)}`);
  }

  const [bookmarks, progress] = await Promise.all([
    prisma.bookmark.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        work: {
          select: {
            id: true,
            slug: true,
            title: true,
            coverImage: true,
            type: true,
            likeCount: true,
            ratingAvg: true,
            ratingCount: true,
            author: { select: { username: true, name: true } },
          },
        },
      },
    }),
    prisma.readingProgress.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      take: 30,
      include: {
        work: { select: { id: true, slug: true, title: true, coverImage: true, type: true } },
        chapter: { select: { id: true, number: true, title: true } },
      },
    }),
  ]);

  const progressByWork = new Map<string, (typeof progress)[number]>();
  for (const p of progress) progressByWork.set(p.workId, p);

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Library</h1>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6">
            <div className="flex items-end justify-between gap-3">
              <h2 className="text-xl font-bold">Continue reading</h2>
              <Link href="/search" className="text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline">Search</Link>
            </div>
            {progress.length === 0 ? (
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">There's no progress yet. Try reading one chapter first.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {progress.map((p) => (
                  <Link
                    key={`${p.workId}-${p.chapterId}`}
                    href={`/w/${p.work.slug}/read/${p.chapterId}`}
                    className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    <div className="w-12 h-16 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden border border-gray-200 dark:border-gray-800">
                      {p.work.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.work.coverImage} alt={p.work.title} className="w-full h-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold line-clamp-1">{p.work.title}</div>
                      <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                        {p.work.type} • Chapter {p.chapter?.number}: {p.chapter?.title}
                      </div>
                      {p.progress != null ? (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-[11px] text-gray-600 dark:text-gray-300">
                            <span>Progress</span>
                            <span className="font-semibold">{Math.round(p.progress * 100)}%</span>
                          </div>
                          <div className="mt-1 h-2 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-500 via-pink-500 to-purple-600" style={{ width: `${Math.round(p.progress * 100)}%` }} />
                          </div>
                        </div>
                      ) : null}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">→</div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6">
            <div className="flex items-end justify-between gap-3">
              <h2 className="text-xl font-bold">Bookmarked</h2>
              <Link href="/all" className="text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline">Explore</Link>
            </div>

            {bookmarks.length === 0 ? (
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">There are no bookmarks yet. Click the Save button on the work page.</p>
            ) : (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                {bookmarks.map((b) => {
                  const w = b.work;
                  const p = progressByWork.get(w.id);
                  const href = p?.chapterId ? `/w/${w.slug}/read/${p.chapterId}` : `/w/${w.slug}`;
                  return (
                    <Link
                      key={w.id}
                      href={href}
                      className="group rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 overflow-hidden hover:shadow-lg transition"
                    >
                      <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-800">
                        {w.coverImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={w.coverImage} alt={w.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition" />
                        ) : null}
                      </div>
                      <div className="p-3">
                        <div className="text-sm font-bold leading-snug line-clamp-2">{w.title}</div>
                        <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                          {w.type} • {w.author.name || w.author.username}
                        </div>
                        <div className="mt-2 text-[11px] text-gray-600 dark:text-gray-300 flex items-center gap-3">
                          <span> {w.likeCount}</span>
                          <span>⭐ {(Math.round(w.ratingAvg * 10) / 10).toFixed(1)} ({w.ratingCount})</span>
                        </div>
                        {p?.chapter ? (
                          <div className="mt-2 text-[11px] text-gray-600 dark:text-gray-300">
                            Continue: Ch {p.chapter.number}{p.progress != null ? ` • ${Math.round(p.progress * 100)}%` : ""}
                          </div>
                        ) : null}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

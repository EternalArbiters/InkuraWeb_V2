import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import ContentWarningsGate from "@/components/ContentWarningsGate";

export const dynamic = "force-dynamic";

export default async function WorkPage({ params: paramsPromise }: { params: Promise<{ slug: string }> }) {
  const params = await paramsPromise;
  const work = await prisma.work.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      coverImage: true,
      type: true,
      status: true,
      isMature: true,
      language: true,
      origin: true,
      completion: true,
      chapterCount: true,
      warningTags: { select: { name: true, slug: true } },
      genres: { select: { name: true, slug: true } },
      tags: { select: { name: true, slug: true } },
      authorId: true,
      author: { select: { username: true, name: true } },
      chapters: {
        where: { status: "PUBLISHED" },
        orderBy: [{ number: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          title: true,
          number: true,
          createdAt: true,
          isMature: true,
          warningTags: { select: { name: true, slug: true } },
          pages: { select: { id: true }, take: 1 },
          text: { select: { id: true } },
        },
      },
    },
  });

  if (!work || work.status !== "PUBLISHED") return notFound();

  const session = await getServerSession(authOptions);
  const me = session?.user?.id
    ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, role: true, matureOptIn: true } })
    : null;

  const isOwner = !!me?.id && me.id === work.authorId;
  const canViewMature = isOwner || me?.role === "ADMIN" || !!me?.matureOptIn;

  if (work.isMature && !canViewMature) {
    return (
      <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 overflow-hidden">
            <div className="p-6">
              <div className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-black/70 text-white">
                18+ Mature Content
              </div>
              <h1 className="mt-3 text-2xl md:text-3xl font-extrabold tracking-tight">{work.title}</h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Karya ini ditandai 18+. Untuk membaca, kamu perlu opt-in di Settings.
              </p>

              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <Link
                  href="/settings/account"
                  className="px-4 py-2 rounded-xl bg-purple-600 text-white font-semibold hover:brightness-110"
                >
                  Buka Settings (opt-in 18+)
                </Link>
                <Link
                  href="/search"
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  Kembali ke Search
                </Link>
              </div>

              {work.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={work.coverImage}
                  alt={work.title}
                  className="mt-6 w-full max-w-sm rounded-2xl border border-gray-200 dark:border-gray-800 blur-md"
                />
              ) : null}
            </div>
          </div>
        </div>
      </main>
    );
  }

  const combinedWarnings = work.warningTags;

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
          <div>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white/70 dark:bg-gray-900/50">
              <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-800">
                {work.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={work.coverImage} alt={work.title} className="w-full h-full object-cover" />
                ) : null}
              </div>
              <div className="p-4">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  by <b>{work.author.name || work.author.username}</b>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 rounded-full border border-gray-200 dark:border-gray-800">{work.type}</span>
                  <span className="px-2 py-1 rounded-full border border-gray-200 dark:border-gray-800">{work.completion}</span>
                  {work.language ? (
                    <span className="px-2 py-1 rounded-full border border-gray-200 dark:border-gray-800">
                      {work.language.toUpperCase()}
                    </span>
                  ) : null}
                  {work.isMature ? (
                    <span className="px-2 py-1 rounded-full bg-black/70 text-white">18+</span>
                  ) : null}
                </div>

                {work.warningTags.length ? (
                  <div className="mt-3">
                    <div className="text-xs font-semibold text-amber-800 dark:text-amber-200">Warnings</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {work.warningTags.map((t) => (
                        <span
                          key={t.slug}
                          className="text-[11px] px-2 py-1 rounded-full border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200"
                        >
                          {t.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {work.genres.length ? (
                  <div className="mt-4">
                    <div className="text-xs font-semibold">Genres</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {work.genres.slice(0, 18).map((g) => (
                        <Link
                          key={g.slug}
                          href={`/search?genre=${g.slug}`}
                          className="text-[11px] px-2 py-1 rounded-full border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                        >
                          {g.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}

                {work.tags.length ? (
                  <div className="mt-4">
                    <div className="text-xs font-semibold">Tags</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {work.tags.slice(0, 24).map((t) => (
                        <Link
                          key={t.slug}
                          href={`/search?tag=${encodeURIComponent(t.name)}`}
                          className="text-[11px] px-2 py-1 rounded-full border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
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
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{work.title}</h1>
            {work.description ? (
              <p className="mt-3 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{work.description}</p>
            ) : null}

            <div className="mt-6">
              <ContentWarningsGate
                storageKey={`work:${work.id}`}
                title={work.title}
                warnings={combinedWarnings}
              >
                <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold">Chapters</div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">{work.chapterCount} total</div>
                  </div>

                  <div className="mt-3 grid gap-2">
                    {work.chapters.map((c) => {
                      const chapterWarnings = c.warningTags || [];
                      const hasAnyWarnings = chapterWarnings.length > 0;
                      return (
                        <Link
                          key={c.id}
                          href={`/w/${work.slug}/read/${c.id}`}
                          className="rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 px-3 py-2"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-semibold">
                              Ch. {c.number}: {c.title}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-2">
                              {c.isMature ? <span className="px-2 py-1 rounded-full bg-black/70 text-white">18+</span> : null}
                              {hasAnyWarnings ? <span className="px-2 py-1 rounded-full border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200"> {chapterWarnings.length}</span> : null}
                            </div>
                          </div>
                        </Link>
                      );
                    })}

                    {work.chapters.length === 0 ? (
                      <div className="text-sm text-gray-600 dark:text-gray-300">Belum ada chapter.</div>
                    ) : null}
                  </div>
                </div>
              </ContentWarningsGate>
            </div>

            <div className="mt-6 text-sm">
              <Link href="/search" className="text-purple-600 dark:text-purple-400 hover:underline">
                ← Back to search
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

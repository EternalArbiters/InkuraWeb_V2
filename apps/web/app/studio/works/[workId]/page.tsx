import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import PublishToggle from "./PublishToggle";

export const dynamic = "force-dynamic";

export default async function StudioWorkPage({ params: paramsPromise }: { params: Promise<{ workId: string }> }) {
  const params = await paramsPromise;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(`/studio/works/${params.workId}`)}`);
  }

  const work = await prisma.work.findUnique({
    where: { id: params.workId },
    include: {
      chapters: {
        orderBy: { number: "asc" },
        include: { pages: true, text: true },
      },
    },
  });

  if (!work) return notFound();
  if (work.authorId !== session.user.id) {
    redirect("/studio");
  }

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight"> {work.title}</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              {work.type} • {work.status} • id: <span className="font-mono text-xs">{work.id}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/studio/works/${work.id}/edit`}
              className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Edit Work
            </Link>
            <PublishToggle workId={work.id} status={work.status as any} />
            <Link
              href={`/studio/works/${work.id}/chapters/new`}
              className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold bg-gradient-to-r from-blue-500 via-pink-500 to-purple-600 text-white hover:brightness-110"
            >
              + Buat Chapter
            </Link>
            <Link
              href={`/w/${work.slug}`}
              className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Lihat Publik
            </Link>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6">
          <h2 className="text-xl font-bold">Chapters</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Minimal MVP: buat chapter → upload teks (novel) atau upload pages (comic) → buka reader.
          </p>

          {work.chapters.length === 0 ? (
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">Belum ada chapter.</div>
          ) : (
            <div className="mt-4 space-y-3">
              {work.chapters.map((c) => {
                const hasText = !!c.text?.content;
                const pageCount = c.pages?.length || 0;
                const readerHref =
                  `/w/${work.slug}/read/${c.id}`;

                return (
                  <div
                    key={c.id}
                    className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                  >
                    <div>
                      <div className="font-bold">
                        Chapter {c.number}: {c.title}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                        {work.type === "NOVEL" ? (hasText ? "Text: OK" : "Text: kosong") : `Pages: ${pageCount}`} • id: {c.id}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={readerHref}
                        className="inline-flex items-center justify-center rounded-full px-4 py-1.5 text-xs font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        Buka Reader
                      </Link>

                      <Link
                        href={`/studio/works/${work.id}/chapters/${c.id}/edit`}
                        className="inline-flex items-center justify-center rounded-full px-4 py-1.5 text-xs font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        Edit Chapter
                      </Link>

                      {work.type === "COMIC" ? (
                        <Link
                          href={`/studio/works/${work.id}/chapters/${c.id}/pages`}
                          className="inline-flex items-center justify-center rounded-full px-4 py-1.5 text-xs font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          Manage Pages
                        </Link>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

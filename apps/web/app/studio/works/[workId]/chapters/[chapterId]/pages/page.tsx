import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import ComicPagesManager from "./ComicPagesManager";

export const dynamic = "force-dynamic";

export default async function ChapterPagesPage({ params: paramsPromise }: { params: Promise<{ workId: string; chapterId: string }> }) {
  const params = await paramsPromise;
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const chapter = await prisma.chapter.findFirst({
    where: { id: params.chapterId, work: { id: params.workId, authorId: session.user.id } },
    select: {
      id: true,
      number: true,
      title: true,
      work: { select: { id: true, title: true, type: true } },
      pages: { orderBy: { order: "asc" }, select: { id: true, imageUrl: true, order: true } },
    },
  });

  if (!chapter) redirect(`/studio/works/${params.workId}`);
  if (chapter.work.type !== "COMIC") redirect(`/studio/works/${params.workId}`);

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Manage Pages</h1>
          <Link
            href={`/studio/works/${chapter.work.id}`}
            className="text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline"
          >
            ← Back
          </Link>
        </div>

        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Work: <b>{chapter.work.title}</b> • Chapter {chapter.number}{chapter.title ? `: ${chapter.title}` : ""}
        </p>

        <ComicPagesManager workId={chapter.work.id} chapterId={chapter.id} pages={chapter.pages as any} />
      </div>
    </main>
  );
}

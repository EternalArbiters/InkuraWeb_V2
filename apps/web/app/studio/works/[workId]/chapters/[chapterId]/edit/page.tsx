import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import ChapterEditForm from "./ChapterEditForm";

export const dynamic = "force-dynamic";

export default async function EditChapterPage({ params: paramsPromise }: { params: Promise<{ workId: string; chapterId: string }> }) {
  const params = await paramsPromise;
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [chapter, warningTags] = await Promise.all([
    prisma.chapter.findFirst({
      where: { id: params.chapterId, work: { id: params.workId, authorId: session.user.id } },
      select: {
        id: true,
        number: true,
        title: true,
        status: true,
        isMature: true,
        warningTags: { select: { id: true, name: true, slug: true } },
        work: { select: { id: true, title: true, type: true } },
        text: { select: { content: true } },
        pages: { select: { id: true }, take: 1 },
      },
    }),
    prisma.warningTag.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } }),
  ]);

  if (!chapter) redirect(`/studio/works/${params.workId}`);

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Edit Chapter</h1>
          <Link
            href={`/studio/works/${chapter.work.id}`}
            className="text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline"
          >
            ← Back
          </Link>
        </div>

        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Work: <b>{chapter.work.title}</b>
        </p>

        <ChapterEditForm workId={chapter.work.id} workTitle={chapter.work.title} workType={chapter.work.type} chapter={chapter as any} warningTags={warningTags as any} />
      </div>
    </main>
  );
}

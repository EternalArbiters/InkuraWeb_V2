import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import ChapterCreateForm from "./ChapterCreateForm";

export const dynamic = "force-dynamic";

export default async function NewChapterPage({ params: paramsPromise }: { params: Promise<{ workId: string }> }) {
  const params = await paramsPromise;
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [work, warningTags] = await Promise.all([
    prisma.work.findFirst({
      where: { id: params.workId, authorId: session.user.id },
      select: {
        id: true,
        title: true,
        type: true,
        chapters: { select: { number: true }, orderBy: { number: "desc" }, take: 1 },
      },
    }),
    prisma.warningTag.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } }),
  ]);

  if (!work) redirect("/studio");

  const last = work.chapters[0]?.number || 0;
  const nextNumber = last + 1;

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">New Chapter</h1>
          <Link href={`/studio/works/${work.id}`} className="text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline">
            ← Back
          </Link>
        </div>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Work: <b>{work.title}</b> ({work.type})
        </p>

        <ChapterCreateForm workTitle={work.title} workId={work.id} workType={work.type} nextNumber={nextNumber} warningTags={warningTags as any} />
      </div>
    </main>
  );
}

import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import WorkEditForm from "./WorkEditForm";

export const dynamic = "force-dynamic";

export default async function WorkEditPage({ params: paramsPromise }: { params: Promise<{ workId: string }> }) {
  const params = await paramsPromise;
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [work, genres, warningTags] = await Promise.all([
    prisma.work.findFirst({
      where: { id: params.workId, authorId: session.user.id },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        coverImage: true,
        language: true,
        origin: true,
        completion: true,
        isMature: true,
        genres: { select: { id: true, name: true, slug: true } },
        warningTags: { select: { id: true, name: true, slug: true } },
        tags: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.genre.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } }),
    prisma.warningTag.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } }),
  ]);

  if (!work) redirect("/studio");

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Edit Work</h1>
          <Link href={`/studio/works/${work.id}`} className="text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline">
            ← Back
          </Link>
        </div>

        <WorkEditForm work={work as any} genres={genres} warningTags={warningTags} />
      </div>
    </main>
  );
}

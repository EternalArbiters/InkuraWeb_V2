import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ChapterEditForm from "./ChapterEditForm";
import { apiJson } from "@/lib/serverApi";

export const dynamic = "force-dynamic";

export default async function EditChapterPage({
  params: paramsPromise,
}: {
  params: Promise<{ workId: string; chapterId: string }>;
}) {
  const params = await paramsPromise;

  const chapterRes = await apiJson<{ chapter: any }>(`/api/studio/chapters/${params.chapterId}`);
  if (!chapterRes.ok) {
    if (chapterRes.status === 401) {
      redirect(`/auth/signin?callbackUrl=${encodeURIComponent(`/studio/works/${params.workId}`)}`);
    }
    if (chapterRes.status === 403) {
      redirect(`/studio/works/${params.workId}`);
    }
    return notFound();
  }

  const chapter = chapterRes.data.chapter;
  if (!chapter) return notFound();

  const warningsRes = await apiJson<{ warningTags: any[] }>("/api/warnings?take=200");
  const warningTags = warningsRes.ok
    ? warningsRes.data.warningTags.map((w: any) => ({ id: w.id, label: w.name, description: w.slug }))
    : [];

  const workTitle = chapter.work?.title || "";
  const workType = chapter.work?.type || "NOVEL";

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <Link href={`/studio/works/${params.workId}`} className="text-sm text-purple-600 dark:text-purple-400 hover:underline">
          ← Back to Work
        </Link>
        <h1 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight">Edit Chapter</h1>

        <ChapterEditForm
          workId={params.workId}
          workTitle={workTitle}
          workType={workType}
          chapter={chapter}
          warningTags={warningTags}
        />
      </div>
    </main>
  );
}

import { notFound, redirect } from "next/navigation";
import ChapterEditForm from "./ChapterEditForm";
import { apiJson } from "@/lib/serverApi";
import BackButton from "@/app/components/BackButton";

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
    ? warningsRes.data.warningTags.map((w: any) => ({ id: String(w.id), name: String(w.name), slug: String(w.slug) }))
    : [];

  const workTitle = chapter.work?.title || "";
  const workType = chapter.work?.type || "NOVEL";

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <BackButton href={`/studio/works/${params.workId}`} />
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

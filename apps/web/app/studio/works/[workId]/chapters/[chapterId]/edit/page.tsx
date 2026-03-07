import { notFound, redirect } from "next/navigation";
import ChapterEditForm from "./ChapterEditForm";
import BackButton from "@/app/components/BackButton";
import { ApiError } from "@/server/http";
import { listActiveWarningTags } from "@/server/services/taxonomy/publicTaxonomy";
import { getStudioChapterForEdit } from "@/server/services/studio/chapters";

export const dynamic = "force-dynamic";

export default async function EditChapterPage({
  params: paramsPromise,
}: {
  params: Promise<{ workId: string; chapterId: string }>;
}) {
  const params = await paramsPromise;

  let chapter: any;
  try {
    ({ chapter } = await getStudioChapterForEdit(params.chapterId));
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) {
        redirect(`/auth/signin?callbackUrl=${encodeURIComponent(`/studio/works/${params.workId}`)}`);
      }
      if (error.status === 403) {
        redirect(`/studio/works/${params.workId}`);
      }
      if (error.status === 404) {
        notFound();
      }
    }
    throw error;
  }

  const warningTags = (await listActiveWarningTags({ take: 200 })).map((w) => ({ id: String(w.id), name: String(w.name), slug: String(w.slug) }));

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

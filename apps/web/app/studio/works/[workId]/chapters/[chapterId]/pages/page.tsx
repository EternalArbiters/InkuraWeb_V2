import { notFound, redirect } from "next/navigation";
import ComicPagesManager from "./ComicPagesManager";
import BackButton from "@/app/components/BackButton";
import { ApiError } from "@/server/http";
import { getStudioChapterForEdit } from "@/server/services/studio/chapters";

export const dynamic = "force-dynamic";

export default async function ChapterPagesPage({
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

  const workType = chapter.work?.type;
  if (workType !== "COMIC") {
    redirect(`/studio/works/${params.workId}/chapters/${params.chapterId}/edit`);
  }

  const pages = Array.isArray(chapter.pages) ? chapter.pages.map((p: any) => ({ id: p.id, imageUrl: p.imageUrl, order: p.order })) : [];

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <BackButton href={`/studio/works/${params.workId}`} />
        <h1 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight">Manage Pages</h1>

        <div className="mt-6">
          <ComicPagesManager workId={params.workId} chapterId={params.chapterId} pages={pages} thumbnailImage={(chapter as any).thumbnailImage || null} />
        </div>
      </div>
    </main>
  );
}

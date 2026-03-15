import BackButton from "@/app/components/BackButton";
import { redirect } from "next/navigation";
import ChapterCreateForm from "./ChapterCreateForm";
import { ApiError } from "@/server/http";
import { listActiveWarningTags } from "@/server/services/taxonomy/publicTaxonomy";
import { getStudioWorkById } from "@/server/services/studio/workById";
import { getActiveUILanguageText } from "@/server/services/uiLanguage/runtime";

export const dynamic = "force-dynamic";

export default async function NewChapterPage({
  params: paramsPromise,
}: {
  params: Promise<{ workId: string }>;
}) {
  const params = await paramsPromise;
  const workId = params.workId;

  let work: any;
  try {
    ({ work } = await getStudioWorkById(workId));
  } catch (error) {
    if (error instanceof ApiError) {
      redirect("/studio");
    }
    throw error;
  }

  const warningTags = await listActiveWarningTags({ take: 100 });
  const tNewChapter = await getActiveUILanguageText("New Chapter");

  const chapters = Array.isArray(work.chapters) ? work.chapters : [];
  const lastNum = chapters.length ? chapters[chapters.length - 1].number : 0;
  const nextNumber = lastNum + 1;

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{tNewChapter}</h1>
          <BackButton href={`/studio/works/${work.id}`} />
        </div>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Work: <b>{work.title}</b> ({work.type})
        </p>

        <ChapterCreateForm workTitle={work.title} workId={work.id} workType={work.type} nextNumber={nextNumber} warningTags={warningTags as any} />
      </div>
    </main>
  );
}

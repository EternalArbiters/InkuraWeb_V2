import BackButton from "@/app/components/BackButton";
import { redirect } from "next/navigation";
import BulkPdfChapterForm from "./BulkPdfChapterForm";
import { ApiError } from "@/server/http";
import { listActiveWarningTags } from "@/server/services/taxonomy/publicTaxonomy";
import { getStudioWorkById } from "@/server/services/studio/workById";
import ListSurface from "@/app/components/ListSurface";

export const dynamic = "force-dynamic";

export default async function BulkPdfChapterPage({
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

  // v30: this feature is comic-only — a PDF's pages become comic pages, which has
  // no equivalent for NOVEL works.
  if (work.type !== "COMIC") {
    redirect(`/studio/works/${work.id}/chapters/new`);
  }

  const warningTags = await listActiveWarningTags({ take: 100 });

  const chapters = Array.isArray(work.chapters) ? work.chapters : [];
  const lastNum = chapters.length ? chapters[chapters.length - 1].number : 0;
  const nextNumber = lastNum + 1;

  return (
    <ListSurface>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Import Chapters from PDFs</h1>
          <BackButton href={`/studio/works/${work.id}/chapters/new`} />
        </div>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Work: <b>{work.title}</b> ({work.type})
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Select multiple PDFs — each one becomes its own new chapter, auto-sorted and auto-numbered from{" "}
          {nextNumber}.
        </p>

        <BulkPdfChapterForm workId={work.id} nextNumber={nextNumber} warningTags={warningTags as any} />
      </div>
    </ListSurface>
  );
}

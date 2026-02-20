import Link from "next/link";
import { redirect } from "next/navigation";
import ChapterCreateForm from "./ChapterCreateForm";
import { apiJson } from "@/lib/serverApi";

export const dynamic = "force-dynamic";

export default async function NewChapterPage({
  params: paramsPromise,
}: {
  params: Promise<{ workId: string }>;
}) {
  const params = await paramsPromise;
  const workId = params.workId;

  const [workRes, warningsRes] = await Promise.all([
    apiJson<{ work: any }>(`/api/studio/works/${workId}`),
    apiJson<{ warningTags: any[] }>("/api/warnings"),
  ]);

  if (!workRes.ok) redirect("/studio");

  const work = workRes.data.work;
  const warningTags = warningsRes.ok ? warningsRes.data.warningTags : [];

  const chapters = Array.isArray(work.chapters) ? work.chapters : [];
  const lastNum = chapters.length ? chapters[chapters.length - 1].number : 0;
  const nextNumber = lastNum + 1;

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

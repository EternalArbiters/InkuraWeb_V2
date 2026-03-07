import BackButton from "@/app/components/BackButton";
import { redirect } from "next/navigation";
import WorkEditForm from "./WorkEditForm";
import { ApiError } from "@/server/http";
import { getStudioWorkById } from "@/server/services/studio/workById";
import { listActiveDeviantLoveTags, listActiveGenres, listActiveWarningTags } from "@/server/services/taxonomy/publicTaxonomy";

export const dynamic = "force-dynamic";

export default async function WorkEditPage({
  params: paramsPromise,
}: {
  params: Promise<{ workId: string }>;
}) {
  const params = await paramsPromise;
  const workId = params.workId;

  try {
    const [workRes, genres, warningTags, deviantLoveTags] = await Promise.all([
      getStudioWorkById(workId),
      listActiveGenres({ take: 200 }),
      listActiveWarningTags({ take: 100 }),
      listActiveDeviantLoveTags({ take: 200 }),
    ]);

    return (
      <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Edit work</h1>
            </div>
            <BackButton href={`/studio/works/${workId}`} />
          </div>

          <WorkEditForm
            work={workRes.work as any}
            genres={genres as any}
            warningTags={warningTags as any}
            deviantLoveTags={deviantLoveTags as any}
          />
        </div>
      </main>
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect(`/auth/signin?callbackUrl=${encodeURIComponent(`/studio/works/${workId}/edit`)}`);
    }
    redirect(`/studio/works/${workId}`);
  }
}

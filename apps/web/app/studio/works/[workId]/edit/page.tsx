import BackButton from "@/app/components/BackButton";
import { redirect } from "next/navigation";
import WorkEditForm from "./WorkEditForm";
import { ApiError } from "@/server/http";
import { getStudioWorkById } from "@/server/services/studio/workById";
import { listActiveDeviantLoveTags, listActiveGenres, listActiveWarningTags } from "@/server/services/taxonomy/publicTaxonomy";
import { getActiveUILanguageText } from "@/server/services/uiLanguage/runtime";
import ListSurface from "@/app/components/ListSurface";

export const dynamic = "force-dynamic";

export default async function WorkEditPage({
  params: paramsPromise,
}: {
  params: Promise<{ workId: string }>;
}) {
  const params = await paramsPromise;
  const workId = params.workId;

  try {
    const [workRes, genres, warningTags, deviantLoveTags, tEditWork] = await Promise.all([
      getStudioWorkById(workId),
      listActiveGenres({ take: 200 }),
      listActiveWarningTags({ take: 100 }),
      listActiveDeviantLoveTags({ take: 200 }),
      getActiveUILanguageText("Edit work"),
    ]);

    return (
      <ListSurface>
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{tEditWork}</h1>
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
      </ListSurface>
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect(`/auth/signin?callbackUrl=${encodeURIComponent(`/studio/works/${workId}/edit`)}`);
    }
    redirect(`/studio/works/${workId}`);
  }
}

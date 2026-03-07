import BackButton from "@/app/components/BackButton";
import { redirect } from "next/navigation";
import NewWorkForm from "./NewWorkForm";
import { getViewerPreferences } from "@/server/services/preferences/viewerPreferences";
import { listActiveDeviantLoveTags, listActiveGenres, listActiveWarningTags } from "@/server/services/taxonomy/publicTaxonomy";

export const dynamic = "force-dynamic";

export default async function StudioNewWorkPage() {
  const [prefs, genres, warningTags, deviantLoveTags] = await Promise.all([
    getViewerPreferences(),
    listActiveGenres({ take: 200 }),
    listActiveWarningTags({ take: 100 }),
    listActiveDeviantLoveTags({ take: 200 }),
  ]);

  if (!prefs) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(`/studio/new`)}`);
  }

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Create new work</h1>
          </div>
          <BackButton href="/studio" />
        </div>

        <NewWorkForm genres={genres as any} warningTags={warningTags as any} deviantLoveTags={deviantLoveTags as any} />
      </div>
    </main>
  );
}

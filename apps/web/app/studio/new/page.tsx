import ActionLink from "@/app/components/ActionLink";
import { redirect } from "next/navigation";
import { apiJson } from "@/lib/serverApi";
import NewWorkForm from "./NewWorkForm";

export const dynamic = "force-dynamic";

export default async function StudioNewWorkPage() {
  const [prefsRes, genresRes, warningsRes, deviantRes] = await Promise.all([
    apiJson<{ prefs: any }>("/api/me/preferences"),
    apiJson<{ genres: any[] }>("/api/genres?take=200"),
    apiJson<{ warningTags: any[] }>("/api/warnings?take=100"),
    apiJson<{ deviantLoveTags: any[] }>("/api/deviant-love?take=200"),
  ]);

  if (!prefsRes.ok) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(`/studio/new`)}`);
  }

  const prefs = prefsRes.data.prefs;

  const genres = genresRes.ok ? genresRes.data.genres : [];
  const warningTags = warningsRes.ok ? warningsRes.data.warningTags : [];
  const deviantLoveTags = deviantRes.ok ? deviantRes.data.deviantLoveTags : [];

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Create new work</h1>
          </div>
          <ActionLink href="/studio">Back</ActionLink>
        </div>

        <NewWorkForm genres={genres as any} warningTags={warningTags as any} deviantLoveTags={deviantLoveTags as any} />
      </div>
    </main>
  );
}

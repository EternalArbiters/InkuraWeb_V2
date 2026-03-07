import Link from "next/link";
import { redirect } from "next/navigation";
import PreferencesForm from "./PreferencesForm";
import { getViewerPreferences } from "@/server/services/preferences/viewerPreferences";
import { listActiveDeviantLoveTags, listActiveGenres, listActiveWarningTags } from "@/server/services/taxonomy/publicTaxonomy";

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
  const [prefs, genres, warnings, deviantLoveTags] = await Promise.all([
    getViewerPreferences(),
    listActiveGenres(),
    listActiveWarningTags(),
    listActiveDeviantLoveTags(),
  ]);

  if (!prefs) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(`/settings/account`)}`);
  }

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Account Settings</h1>
          </div>
          <Link
            href="/home"
            className="rounded-full px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Back
          </Link>
        </div>

        <PreferencesForm
          genres={genres as any}
          warnings={warnings as any}
          deviantLoveTags={deviantLoveTags as any}
          initial={{
            adultConfirmed: prefs.adultConfirmed,
            deviantLoveConfirmed: prefs.deviantLoveConfirmed,
            preferredLanguages: prefs.preferredLanguages,
            blockedGenreIds: prefs.blockedGenreIds,
            blockedWarningIds: prefs.blockedWarningIds,
            blockedDeviantLoveIds: prefs.blockedDeviantLoveIds,
          }}
        />
      </div>
    </main>
  );
}

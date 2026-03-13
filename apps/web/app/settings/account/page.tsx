import BackButton from "@/app/components/BackButton";
import { redirect } from "next/navigation";
import PreferencesForm from "./PreferencesForm";
import { getViewerPreferences } from "@/server/services/preferences/viewerPreferences";
import { listActiveDeviantLoveTags, listActiveGenres, listActiveWarningTags } from "@/server/services/taxonomy/publicTaxonomy";
import { getActiveUILanguageText } from "@/server/services/uiLanguage/runtime";

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
  const [prefs, genres, warnings, deviantLoveTags, title] = await Promise.all([
    getViewerPreferences(),
    listActiveGenres(),
    listActiveWarningTags(),
    listActiveDeviantLoveTags(),
    getActiveUILanguageText("Account Settings", { section: "Page Settings Account" }),
  ]);

  if (!prefs) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(`/settings/account`)}`);
  }

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{title}</h1>
          </div>
          <BackButton href="/home" />
        </div>

        <PreferencesForm
          genres={genres as any}
          warnings={warnings as any}
          deviantLoveTags={deviantLoveTags as any}
          initial={{
            adultConfirmed: prefs.adultConfirmed,
            deviantLoveConfirmed: prefs.deviantLoveConfirmed,
            inkuraLanguage: prefs.inkuraLanguage,
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

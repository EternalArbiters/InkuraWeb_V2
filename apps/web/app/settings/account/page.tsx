import Link from "next/link";
import { redirect } from "next/navigation";
import PreferencesForm from "./PreferencesForm";
import { apiJson } from "@/lib/serverApi";

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
  const [prefsRes, genresRes, warningsRes, deviantRes] = await Promise.all([
    apiJson<{ prefs: any }>("/api/me/preferences"),
    apiJson<{ genres: any[] }>("/api/genres"),
    apiJson<{ warningTags: any[] }>("/api/warnings"),
    apiJson<{ deviantLoveTags: any[] }>("/api/deviant-love"),
  ]);

  if (!prefsRes.ok) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(`/settings/account`)}`);
  }

  const genres = genresRes.ok ? genresRes.data.genres : [];
  const warnings = warningsRes.ok ? warningsRes.data.warningTags : [];
  const deviantLoveTags = deviantRes.ok ? deviantRes.data.deviantLoveTags : [];

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Account Settings</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Preferences and content filters.</p>
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
            adultConfirmed: prefsRes.data.prefs.adultConfirmed,
            deviantLoveConfirmed: prefsRes.data.prefs.deviantLoveConfirmed,
            preferredLanguages: prefsRes.data.prefs.preferredLanguages,
            blockedGenreIds: prefsRes.data.prefs.blockedGenreIds,
            blockedWarningIds: prefsRes.data.prefs.blockedWarningIds,
            blockedDeviantLoveIds: prefsRes.data.prefs.blockedDeviantLoveIds,
          }}
        />
      </div>
    </main>
  );
}

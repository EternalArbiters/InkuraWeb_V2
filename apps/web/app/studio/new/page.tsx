import Link from "next/link";
import { redirect } from "next/navigation";
import { apiJson } from "@/lib/serverApi";
import NewWorkForm from "./NewWorkForm";

export const dynamic = "force-dynamic";

export default async function StudioNewWorkPage() {
  const [prefsRes, genresRes, warningsRes] = await Promise.all([
    apiJson<{ prefs: any }>("/api/me/preferences"),
    apiJson<{ genres: any[] }>("/api/genres?take=200"),
    apiJson<{ warningTags: any[] }>("/api/warnings?take=100"),
  ]);

  if (!prefsRes.ok) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(`/studio/new`)}`);
  }

  const prefs = prefsRes.data.prefs;
  const creatorRole = String(prefs.creatorRole || "READER").toUpperCase();

  const genres = genresRes.ok ? genresRes.data.genres : [];
  const warningTags = warningsRes.ok ? warningsRes.data.warningTags : [];

  if (creatorRole === "READER") {
    return (
      <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <h1 className="text-3xl font-extrabold tracking-tight">Studio</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Kamu masih <b>Reader</b>. Pilih role (Author / Translator / Uploader) dulu di Settings.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href="/settings/account"
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 text-sm font-semibold"
            >
              Open Settings
            </Link>
            <Link
              href="/studio"
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 text-sm font-semibold"
            >
              Back
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Create new work</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Role: {creatorRole}</p>
          </div>
          <Link href="/studio" className="text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline">
            Back →
          </Link>
        </div>

        <NewWorkForm genres={genres as any} warningTags={warningTags as any} creatorRole={creatorRole as any} />
      </div>
    </main>
  );
}

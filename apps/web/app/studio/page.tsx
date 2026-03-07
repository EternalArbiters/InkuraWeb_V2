import Link from "next/link";
import { redirect } from "next/navigation";
import { apiJson } from "@/server/http/apiJson";
import StudioWorksGridClient from "./StudioWorksGridClient";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const [prefsRes, worksRes] = await Promise.all([
    apiJson<{ prefs: any }>("/api/me/preferences"),
    apiJson<{ works: any[] }>("/api/studio/works"),
  ]);

  if (!prefsRes.ok) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(`/studio`)}`);
  }

  const works = worksRes.ok ? (worksRes.data.works || []) : [];

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Upload</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/settings/account"
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 text-sm font-semibold"
            >
              Settings
            </Link>
            <Link
              href="/studio/series"
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 text-sm font-semibold"
            >
              Manage series
            </Link>
            <Link
              href="/studio/new"
              className="px-4 py-2 rounded-xl text-white text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:brightness-110"
            >
              Create new
            </Link>
          </div>
        </div>

        <div className="mt-8">
          {works.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-6 text-sm text-gray-600 dark:text-gray-300">
              No works yet.
            </div>
          ) : (
            <StudioWorksGridClient works={works as any} />
          )}
        </div>
      </div>
    </main>
  );
}

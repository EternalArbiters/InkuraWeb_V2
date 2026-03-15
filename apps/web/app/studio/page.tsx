import Link from "next/link";
import StudioWorksGridClient from "./StudioWorksGridClient";
import { getActiveUILanguageText } from "@/server/services/uiLanguage/runtime";
import { requirePageUserId } from "@/server/auth/pageAuth";
import { listStudioWorksForViewer } from "@/server/services/studio/works";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  await requirePageUserId("/studio");
  const { works } = await listStudioWorksForViewer();

  const [tCreateNew, tManageSeries, tSettings, tNoWorks] = await Promise.all([
    getActiveUILanguageText("Create new"),
    getActiveUILanguageText("Manage series"),
    getActiveUILanguageText("Settings"),
    getActiveUILanguageText("No works yet."),
  ]);
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
              {tSettings}
            </Link>
            <Link
              href="/studio/series"
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 text-sm font-semibold text-center"
            >
              {tManageSeries}
            </Link>
            <Link
              href="/studio/new"
              className="px-4 py-2 rounded-xl text-white text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:brightness-110 text-center"
            >
              {tCreateNew}
            </Link>
          </div>
        </div>

        <div className="mt-8">
          {works.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-6 text-sm text-gray-600 dark:text-gray-300">
              {tNoWorks}
            </div>
          ) : (
            <StudioWorksGridClient works={works as any} />
          )}
        </div>
      </div>
    </main>
  );
}

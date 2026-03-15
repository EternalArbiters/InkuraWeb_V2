import Link from "next/link";

import WorksGrid from "@/app/components/WorksGrid";
import { requirePageUserId } from "@/server/auth/pageAuth";
import { getViewerLibrary } from "@/server/services/library/viewerLibrary";
import { getActiveUILanguageText } from "@/server/services/uiLanguage/runtime";

export const dynamic = "force-dynamic";

export default async function LibraryBookmarksPage() {
  await requirePageUserId("/library/bookmarks");
  const [tBackToLibrary, tNoBookmarks, tBookmarks] = await Promise.all([
    getActiveUILanguageText("Back to Library"),
    getActiveUILanguageText("No bookmarks yet."),
    getActiveUILanguageText("Bookmarks"),
  ]);
  const { bookmarks } = await getViewerLibrary();
  const bookmarkWorks = bookmarks.map((entry) => entry.work).filter(Boolean);

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{tBookmarks}</h1>
          </div>
          <Link
            href="/library"
            className="inline-flex items-center justify-center rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            {tBackToLibrary}
          </Link>
        </div>

        {bookmarkWorks.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-gray-300 dark:border-gray-800 p-6 text-sm text-gray-600 dark:text-gray-300">
            {tNoBookmarks}
          </div>
        ) : (
          <div className="mt-8">
            <WorksGrid works={bookmarkWorks as any} showRecentUpdateBadge />
          </div>
        )}
      </div>
    </main>
  );
}

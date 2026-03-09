import Link from "next/link";
import WorksGrid from "../components/WorksGrid";
import ActionLink from "@/app/components/ActionLink";
import HorizontalRail from "@/app/home/HorizontalRail";
import { ReadingProgressRailCard } from "@/app/components/library/ReadingProgressCard";
import { requirePageUserId } from "@/server/auth/pageAuth";
import { getViewerLibrary } from "@/server/services/library/viewerLibrary";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  await requirePageUserId("/library");
  const { bookmarks, progress, favorites, lists } = await getViewerLibrary();

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Library</h1>
          </div>
          <Link
            href="/home"
            className="rounded-full px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Home
          </Link>
        </div>

        <div className="mt-10">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-lg font-bold">Continue Reading</h2>
            <ActionLink href="/settings/history">See all</ActionLink>
          </div>
          {progress.length === 0 ? (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">No reading history yet.</p>
          ) : (
            <div className="mt-4">
              <HorizontalRail>
                {progress.slice(0, 12).map((p) => (
                  <ReadingProgressRailCard key={p.id} progress={p as any} />
                ))}
              </HorizontalRail>
            </div>
          )}
        </div>

        <div className="mt-12">
          <h2 className="text-lg font-bold">Bookmarks</h2>
          {bookmarks.length === 0 ? (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">No bookmarks yet.</p>
          ) : (
            <div className="mt-6">
              <WorksGrid works={bookmarks.map((b) => b.work) as any} />
            </div>
          )}
        </div>


        <div className="mt-12">
          <h2 className="text-lg font-bold">Favorites</h2>
          {favorites.length === 0 ? (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">No favorites yet.</p>
          ) : (
            <div className="mt-6">
              <WorksGrid works={favorites.map((x: any) => x.work) as any} />
            </div>
          )}
        </div>

        <div className="mt-12">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold">Your Lists</h2>
            <Link href="/lists" className="text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline">
              Manage
            </Link>
          </div>

          {lists.length === 0 ? (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">No lists yet.</p>
          ) : (
            <div className="mt-6 grid gap-6">
              {lists.map((l: any) => (
                <div key={l.id} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <Link href={`/lists/${l.slug}`} className="font-extrabold hover:underline line-clamp-1">
                      {l.title}
                    </Link>
                    <div className="text-xs text-gray-600 dark:text-gray-300">{l._count?.items ?? 0} items</div>
                  </div>
                  {Array.isArray(l.items) && l.items.length ? (
                    <div className="mt-4">
                      <WorksGrid works={l.items.map((it: any) => it.work) as any} />
                    </div>
                  ) : (
                    <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">Empty.</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

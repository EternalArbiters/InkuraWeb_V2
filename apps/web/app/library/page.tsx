import Link from "next/link";

import ActionLink from "@/app/components/ActionLink";
import CollectionRailCard from "@/app/components/user/CollectionRailCard";
import InteractiveWorkCard from "@/app/components/work/InteractiveWorkCard";
import { ReadingProgressRailCard } from "@/app/components/library/ReadingProgressCard";
import HorizontalRail from "@/app/home/HorizontalRail";
import { requirePageUserId } from "@/server/auth/pageAuth";
import { getViewerLibrary } from "@/server/services/library/viewerLibrary";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  await requirePageUserId("/library");
  const { bookmarks, progress, lists } = await getViewerLibrary();
  const bookmarkWorks = bookmarks.map((entry) => entry.work).filter(Boolean);

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Library</h1>
          </div>
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
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-lg font-bold">Bookmarks</h2>
            <ActionLink href="/library/bookmarks">See all</ActionLink>
          </div>
          {bookmarkWorks.length === 0 ? (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">No bookmarks yet.</p>
          ) : (
            <div className="mt-4">
              <HorizontalRail>
                {bookmarkWorks.slice(0, 12).map((work: any) => (
                  <InteractiveWorkCard
                    key={work.id}
                    work={work as any}
                    className="snap-start shrink-0 w-[160px] sm:w-[190px]"
                    showRecentUpdateBadge
                  />
                ))}
              </HorizontalRail>
            </div>
          )}
        </div>

        <div className="mt-12">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-lg font-bold">Your Collections</h2>
            <ActionLink href="/lists">See all</ActionLink>
          </div>

          {lists.length === 0 ? (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">No lists yet.</p>
          ) : (
            <div className="mt-4">
              <HorizontalRail>
                {lists.map((list: any) => (
                  <CollectionRailCard
                    key={list.id}
                    href={`/lists/${list.slug}`}
                    title={list.title}
                    description={list.description}
                    itemCount={Number(list._count?.items || 0)}
                    items={Array.isArray(list.items) ? list.items : []}
                  />
                ))}
              </HorizontalRail>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

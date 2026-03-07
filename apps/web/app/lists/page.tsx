import Link from "next/link";
import { listReadingListsForViewer } from "@/server/services/readingLists/readingLists";

export const dynamic = "force-dynamic";

type ListLite = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  isPublic: boolean;
  updatedAt: string;
  _count?: { items: number };
  items?: { work: { id: string; coverImage?: string | null; title: string; slug: string } }[];
};

export default async function ListsPage() {
  const data = await listReadingListsForViewer();

  if (!data) {
    return (
      <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6">
            <h1 className="text-2xl font-extrabold">Collectuion</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              You must be logged in to create and manage your collections (Reading Lists)
            </p>
            <div className="mt-4 flex gap-2">
              <Link
                href="/auth/signin?next=/lists"
                className="px-4 py-2 rounded-xl bg-purple-600 text-white font-semibold hover:brightness-110"
              >
                Sign in
              </Link>
              <Link
                href="/search"
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 font-semibold hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                Browse works
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const lists = data.lists || [];

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Collection</h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/lists/new"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold hover:brightness-110"
            >
              New list
            </Link>
            <Link
              href="/library"
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 font-semibold hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              Library
            </Link>
          </div>
        </div>

        {lists.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-8">
            <div className="text-lg font-extrabold">No list yet.</div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Create a list to group your favorite works (e.g.: “Indo Romance”, “Horror”, “Friend Recommendations”).
            </p>
            <div className="mt-4">
              <Link
                href="/lists/new"
                className="inline-flex px-4 py-2 rounded-xl bg-purple-600 text-white font-semibold hover:brightness-110"
              >
                Create first list
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {lists.map((l) => {
              const count = l._count?.items ?? 0;
              const previews = Array.isArray(l.items) ? l.items.map((x) => x.work).filter(Boolean) : [];
              return (
                <Link
                  key={l.id}
                  href={`/lists/${l.slug}`}
                  className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 overflow-hidden hover:shadow-lg transition"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-lg font-extrabold truncate">{l.title}</div>
                        {l.description ? <div className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{l.description}</div> : null}
                      </div>
                      <span
                        className={
                          "shrink-0 text-[11px] px-2 py-1 rounded-full " +
                          (l.isPublic ? "bg-emerald-600 text-white" : "border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200")
                        }
                      >
                        {l.isPublic ? "PUBLIC" : "PRIVATE"}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
                      <span>{count} item</span>
                      <span>Updated {new Date(l.updatedAt).toLocaleDateString()}</span>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {previews.length ? (
                        previews.map((w) => (
                          <div key={w.id} className="aspect-[3/4] bg-gray-100 dark:bg-gray-800 overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            {w.coverImage ? <img src={w.coverImage} alt={w.title} className="w-full h-full object-cover" /> : null}
                          </div>
                        ))
                      ) : (
                        <div className="col-span-3 text-sm text-gray-600 dark:text-gray-300">
                          <span className="opacity-70">No items yet</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

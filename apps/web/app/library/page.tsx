import Link from "next/link";
import { redirect } from "next/navigation";
import WorksGrid from "../components/WorksGrid";
import { apiJson } from "@/lib/serverApi";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const res = await apiJson<{ bookmarks: any[]; progress: any[]; favorites: any[]; lists: any[] }>("/api/library");
  if (!res.ok) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(`/library`)}`);
  }

  const bookmarks = res.data.bookmarks || [];
  const progress = res.data.progress || [];
  const favorites = res.data.favorites || [];
  const lists = res.data.lists || [];

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Library</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Your bookmarks and reading progress.</p>
          </div>
          <Link
            href="/home"
            className="rounded-full px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Home
          </Link>
        </div>

        <div className="mt-10">
          <h2 className="text-lg font-bold">Continue Reading</h2>
          {progress.length === 0 ? (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">No reading history yet.</p>
          ) : (
            <ul className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {progress.slice(0, 6).map((p) => (
                <li key={p.id} className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold">{p.work?.title}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Chapter {p.chapter?.number}: {p.chapter?.title}
                      </div>
                    </div>
                    <Link
                      href={`/w/${p.work?.slug}/read/${p.chapter?.id}`}
                      className="rounded-full px-4 py-2 text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700"
                    >
                      Continue
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
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
              <WorksGrid works={favorites.map((f: any) => f.work) as any} />
            </div>
          )}
        </div>

        <div className="mt-12">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold">Your Lists</h2>
            <Link href="/lists" className="text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline">
              Open Lists
            </Link>
          </div>

          {lists.length === 0 ? (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">No lists yet.</p>
          ) : (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {lists.slice(0, 8).map((l: any) => (
                <Link
                  key={l.id}
                  href={`/lists/${l.slug}`}
                  className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{l.title}</div>
                      <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                        {l._count?.items ?? l.items?.length ?? 0} items
                      </div>
                    </div>
                    <div className="shrink-0 flex -space-x-2">
                      {(l.items || []).slice(0, 3).map((it: any) => (
                        <div
                          key={it.id}
                          className="w-10 h-10 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800"
                        >
                          {it.work?.coverImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={it.work.coverImage} alt={it.work.title} className="w-full h-full object-cover" loading="lazy" />
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

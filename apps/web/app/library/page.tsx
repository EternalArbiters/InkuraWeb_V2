import Link from "next/link";
import { redirect } from "next/navigation";
import WorksGrid from "../components/WorksGrid";
import { apiJson } from "@/lib/serverApi";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const res = await apiJson<{ bookmarks: any[]; progress: any[] }>("/api/library");
  if (!res.ok) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(`/library`)}`);
  }

  const bookmarks = res.data.bookmarks || [];
  const progress = res.data.progress || [];

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
      </div>
    </main>
  );
}

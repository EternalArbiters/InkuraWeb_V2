import Link from "next/link";
import { requirePageUserId } from "@/server/auth/pageAuth";
import { listViewerProgress } from "@/server/services/progress/viewerProgress";

export const dynamic = "force-dynamic";

export default async function ReadingHistoryPage() {
  await requirePageUserId("/settings/history");
  const { progress } = await listViewerProgress({ take: 100 });

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Reading History</h1>
          </div>
          <Link
            href="/settings/account"
            className="rounded-full px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Account Settings
          </Link>
        </div>

        {progress.length === 0 ? (
          <p className="mt-6 text-sm text-gray-600 dark:text-gray-300">No history yet.</p>
        ) : (
          <ul className="mt-6 grid gap-3">
            {progress.map((p) => (
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
                    Open
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

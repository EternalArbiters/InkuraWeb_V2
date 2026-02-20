import Link from "next/link";
import { redirect } from "next/navigation";
import { apiJson } from "@/lib/serverApi";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const [prefsRes, worksRes] = await Promise.all([
    apiJson<{ prefs: any }>("/api/me/preferences"),
    apiJson<{ works: any[] }>("/api/studio/works"),
  ]);

  if (!prefsRes.ok) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(`/studio`)}`);
  }

  const works = worksRes.ok ? worksRes.data.works : [];

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Studio</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Bikin & kelola karya kamu sendiri.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/settings/account"
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 text-sm font-semibold"
            >
              Settings
            </Link>
            <Link
              href="/studio/new"
              className="px-4 py-2 rounded-xl text-white text-sm font-semibold bg-gradient-to-r from-blue-500 via-pink-500 to-purple-600 hover:brightness-110"
            >
              Create new
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-3">
          {works.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-6 text-sm text-gray-600 dark:text-gray-300">
              Belum ada karya.
            </div>
          ) : (
            works.map((w) => (
              <Link
                key={w.id}
                href={`/studio/works/${w.id}`}
                className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">{w.title}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">
                      {w.type} • {w.publishType}
                    </div>
                  </div>
                  <span className="text-sm text-purple-600 dark:text-purple-400">Open →</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </main>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { apiJson } from "@/server/http/apiJson";
import StudioSeriesManagerClient from "./StudioSeriesManagerClient";

export const dynamic = "force-dynamic";

export default async function StudioSeriesPage() {
  const [prefsRes, seriesRes] = await Promise.all([
    apiJson<{ prefs: any }>("/api/me/preferences"),
    apiJson<{ series: any[]; ungroupedWorks: any[] }>("/api/studio/series"),
  ]);

  if (!prefsRes.ok) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(`/studio/series`)}`);
  }

  const initialSeries = seriesRes.ok ? seriesRes.data.series || [] : [];
  const initialUngroupedWorks = seriesRes.ok ? seriesRes.data.ungroupedWorks || [] : [];

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link href="/studio" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
              ← Back to Studio
            </Link>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">Manage Series</h1>
            <p className="mt-2 max-w-3xl text-sm text-gray-600 dark:text-gray-300">
              Group your works into one series, reorder arcs in one place, and keep the public series box tidy.
            </p>
          </div>
        </div>

        <div className="mt-8">
          <StudioSeriesManagerClient initialSeries={initialSeries as any} initialUngroupedWorks={initialUngroupedWorks as any} />
        </div>
      </div>
    </main>
  );
}

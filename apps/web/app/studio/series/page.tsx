import Link from "next/link";
import { redirect } from "next/navigation";
import { apiJson } from "@/server/http/apiJson";
import StudioSeriesManagerClient from "./StudioSeriesManagerClient";

export const dynamic = "force-dynamic";

export default async function StudioSeriesPage() {
  const res = await apiJson<{ series: any[]; unassignedWorks: any[] }>("/api/studio/series");
  if (!res.ok) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(`/studio/series`)}`);
  }

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Manage series</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Organize your works into a proper series and control arc order.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/studio" className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900">
              Back to studio
            </Link>
            <Link href="/studio/new" className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white hover:brightness-110">
              Create new work
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <StudioSeriesManagerClient
            initialSeries={Array.isArray(res.data.series) ? res.data.series : []}
            initialUnassignedWorks={Array.isArray(res.data.unassignedWorks) ? res.data.unassignedWorks : []}
          />
        </div>
      </div>
    </main>
  );
}

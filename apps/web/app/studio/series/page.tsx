import Link from "next/link";
import { requirePageUserId } from "@/server/auth/pageAuth";
import { listStudioSeries } from "@/server/services/studio/series";
import StudioSeriesManagerClient from "./StudioSeriesManagerClient";

export const dynamic = "force-dynamic";

export default async function StudioSeriesPage() {
  await requirePageUserId("/studio/series");
  const { series, unassignedWorks } = await listStudioSeries();

  const initialSeries = (Array.isArray(series) ? series : []).map((item) => ({
    ...item,
    works: (Array.isArray(item.works) ? item.works : []).map((work) => ({
      ...work,
      updatedAt: work.updatedAt ? work.updatedAt.toISOString() : null,
    })),
  }));

  const initialUnassignedWorks = (Array.isArray(unassignedWorks) ? unassignedWorks : []).map((work) => ({
    ...work,
    updatedAt: work.updatedAt ? work.updatedAt.toISOString() : null,
  }));

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
            initialSeries={initialSeries}
            initialUnassignedWorks={initialUnassignedWorks}
          />
        </div>
      </div>
    </main>
  );
}

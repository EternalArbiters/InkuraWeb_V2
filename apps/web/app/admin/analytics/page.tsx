import Link from "next/link";
import BackButton from "@/app/components/BackButton";
import { getAdminAnalyticsData } from "@/server/services/admin/analytics";
import AdminAnalyticsDashboard from "./AdminAnalyticsDashboard";
import AdminAnalyticsActions from "./AdminAnalyticsActions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{
    start?: string | string[];
    end?: string | string[];
    days?: string | string[];
    limit?: string | string[];
  }>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminAnalyticsPage({ searchParams: searchParamsPromise }: Props) {
  const searchParams = (await searchParamsPromise) || {};

  const start = first(searchParams.start) || undefined;
  const end = first(searchParams.end) || undefined;
  const days = first(searchParams.days);
  const limit = first(searchParams.limit);

  const data = await getAdminAnalyticsData({
    start,
    end,
    days: days ? Number(days) : undefined,
    limit: limit ? Number(limit) : undefined,
  });

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200">
              Admin analytics
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Audience, content, and growth in one place</h1>
            <p className="mt-2 max-w-3xl text-sm text-gray-600 dark:text-gray-300 md:text-base">
              See traffic, engagement, favorite genres, creator performance, and search behavior from Inkura's daily aggregated data.
            </p>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/admin/analytics/details?start=${data.range.start}&end=${data.range.end}&limit=${Math.max(data.topWorks.length, data.topGenres.length, data.topCreators.length, data.topSearches.length, 10)}`}
                className="rounded-full border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200 dark:hover:bg-blue-950/50"
              >
                See detail
              </Link>
              <Link
                href="/admin/reports"
                className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                Reports
              </Link>
              <Link
                href="/admin/taxonomy"
                className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                Taxonomy
              </Link>
              <Link
                href="/admin/notify"
                className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                Notify user
              </Link>
              <BackButton href="/home" />
            </div>

            <AdminAnalyticsActions
              start={data.range.start}
              end={data.range.end}
              days={data.range.days}
              limit={Math.max(data.topWorks.length, data.topGenres.length, data.topCreators.length, data.topSearches.length, 10)}
              hasCustomRange={Boolean(start && end)}
            />
          </div>
        </div>

        <AdminAnalyticsDashboard data={data} />
      </div>
    </main>
  );
}

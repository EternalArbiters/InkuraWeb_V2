import type { ReactNode } from "react";
import Link from "next/link";
import { getAdminAnalyticsData } from "@/server/services/admin/analytics";
import { cn } from "@/lib/utils";

type AnalyticsData = Awaited<ReturnType<typeof getAdminAnalyticsData>>;

type Props = {
  data: AnalyticsData;
};

function compact(value: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(Number(value || 0));
}

function integer(value: number) {
  return new Intl.NumberFormat("en").format(Number(value || 0));
}

function percent(value: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

function titleCase(value: string | null | undefined) {
  if (!value) return "Unknown";
  return value
    .toLowerCase()
    .split(/[_\s-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(new Date(value));
}

function rangeQuery(args: { start?: string; end?: string; days?: number; limit?: number }) {
  const params = new URLSearchParams();
  if (args.start) params.set("start", args.start);
  if (args.end) params.set("end", args.end);
  if (args.days) params.set("days", String(args.days));
  if (args.limit) params.set("limit", String(args.limit));
  const query = params.toString();
  return query ? `?${query}` : "/admin/analytics";
}

function buildLinePath(values: number[], width: number, height: number) {
  if (!values.length) return "";
  const max = Math.max(...values, 1);
  const step = values.length === 1 ? 0 : width / (values.length - 1);
  return values
    .map((value, index) => {
      const x = index * step;
      const y = height - (value / max) * height;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

function buildAreaPath(values: number[], width: number, height: number) {
  if (!values.length) return "";
  const line = buildLinePath(values, width, height);
  const max = Math.max(...values, 1);
  const step = values.length === 1 ? 0 : width / (values.length - 1);
  const lastX = (values.length - 1) * step;
  const firstY = height - (values[0] / max) * height;
  return `${line} L ${lastX.toFixed(2)},${height} L 0,${height} L 0,${firstY.toFixed(2)} Z`;
}

function StatCard({ label, value, tone = "blue", hint }: { label: string; value: string; tone?: "blue" | "violet" | "emerald" | "rose"; hint?: string }) {
  const tones = {
    blue: "from-blue-500/15 to-cyan-500/10 border-blue-200/70 dark:border-blue-900/40",
    violet: "from-violet-500/15 to-fuchsia-500/10 border-violet-200/70 dark:border-violet-900/40",
    emerald: "from-emerald-500/15 to-lime-500/10 border-emerald-200/70 dark:border-emerald-900/40",
    rose: "from-rose-500/15 to-orange-500/10 border-rose-200/70 dark:border-rose-900/40",
  };

  return (
    <div className={cn("rounded-3xl border bg-gradient-to-br p-5", tones[tone])}>
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">{label}</div>
      <div className="mt-3 text-3xl font-black tracking-tight">{value}</div>
      {hint ? <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">{hint}</div> : null}
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <section className="rounded-[28px] border border-gray-200 bg-white/90 p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900/80 md:p-6">
      <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-lg font-bold md:text-xl">{title}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">{subtitle}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function TrendChart({ data }: { data: AnalyticsData["overviewSeries"] }) {
  const width = 640;
  const height = 220;
  const visitors = data.map((item) => item.uniqueVisitors);
  const active = data.map((item) => item.activeUsers);
  const max = Math.max(...visitors, ...active, 1);
  const areaPath = buildAreaPath(visitors, width, height);
  const visitorsPath = buildLinePath(visitors, width, height);
  const activePath = buildLinePath(active, width, height);

  return (
    <div>
      <div className="rounded-3xl border border-gray-200/80 bg-gradient-to-b from-white to-gray-50 p-3 dark:border-gray-800 dark:from-gray-950 dark:to-gray-900">
        <svg viewBox={`0 0 ${width} ${height + 24}`} className="h-[260px] w-full">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = height - ratio * height;
            return (
              <g key={ratio}>
                <line x1="0" x2={width} y1={y} y2={y} stroke="currentColor" strokeOpacity="0.08" />
                <text x={width - 4} y={y - 4} textAnchor="end" className="fill-gray-400 text-[10px]">
                  {integer(Math.round(max * ratio))}
                </text>
              </g>
            );
          })}

          <path d={areaPath} fill="rgba(59,130,246,0.14)" />
          <path d={visitorsPath} fill="none" stroke="rgb(37 99 235)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d={activePath} fill="none" stroke="rgb(168 85 247)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

          {data.map((item, index) => {
            const x = data.length === 1 ? 0 : (index / (data.length - 1)) * width;
            return (
              <text key={item.date} x={x} y={height + 16} textAnchor={index === 0 ? "start" : index === data.length - 1 ? "end" : "middle"} className="fill-gray-400 text-[10px]">
                {formatDate(item.date)}
              </text>
            );
          })}
        </svg>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-600" /> Unique visitors
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-2 text-violet-700 dark:border-violet-900/50 dark:bg-violet-950/30 dark:text-violet-200">
          <span className="h-2.5 w-2.5 rounded-full bg-violet-600" /> Active users
        </div>
      </div>
    </div>
  );
}

function TotalsBars({ totals }: { totals: AnalyticsData["headline"]["totals"] }) {
  const items = [
    { label: "Page views", value: Number(totals.pageViews || 0), tone: "bg-sky-500" },
    { label: "Work reads", value: Number(totals.workViews || 0), tone: "bg-blue-600" },
    { label: "Chapter reads", value: Number(totals.chapterViews || 0), tone: "bg-violet-600" },
    { label: "Bookmarks", value: Number(totals.bookmarkAdds || 0), tone: "bg-emerald-500" },
    { label: "Comments", value: Number(totals.commentsCreated || 0), tone: "bg-amber-500" },
    { label: "Searches", value: Number(totals.searches || 0), tone: "bg-rose-500" },
  ];
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <span className="font-semibold">{item.label}</span>
            <span className="text-gray-500 dark:text-gray-400">{integer(item.value)}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div className={cn("h-full rounded-full", item.tone)} style={{ width: `${Math.max(6, (item.value / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function TopWorksTable({ items }: { items: AnalyticsData["topWorks"] }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-800">
      <div className="grid grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,0.7fr))] gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
        <div>Work</div>
        <div>Views</div>
        <div>Readers</div>
        <div>Bookmarks</div>
        <div>Rating</div>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-800">
        {items.map((item) => (
          <div key={item.work.id} className="grid grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,0.7fr))] gap-3 px-4 py-4 text-sm">
            <div className="min-w-0">
              <div className="truncate font-bold">{item.work.title}</div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {titleCase(item.work.type)}{item.work.comicType ? ` • ${titleCase(item.work.comicType)}` : ""}
              </div>
            </div>
            <div className="font-semibold">{compact(item.metrics.views)}</div>
            <div>{compact(item.metrics.uniqueViewers)}</div>
            <div>{compact(item.metrics.bookmarkAdds)}</div>
            <div>{item.metrics.ratingsCount ? item.metrics.ratingAvg.toFixed(1) : "—"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SimpleRankList({ items, valueLabel }: { items: Array<{ label: string; sublabel?: string; value: number; extra?: string }>; valueLabel?: string }) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-900/60">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate font-semibold">{item.label}</div>
              {item.sublabel ? <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{item.sublabel}</div> : null}
              {item.extra ? <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{item.extra}</div> : null}
            </div>
            <div className="text-right">
              <div className="text-lg font-black">{compact(item.value)}</div>
              {valueLabel ? <div className="text-[11px] uppercase tracking-[0.18em] text-gray-400">{valueLabel}</div> : null}
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white dark:bg-gray-950">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500" style={{ width: `${Math.max(8, (item.value / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function DemographicSection({ data }: { data: AnalyticsData["demographics"] }) {
  const genderTotal = data.byGender.reduce((sum, item) => sum + Number(item.metrics.uniqueUsers || 0), 0);
  const ageTotal = data.byAgeBand.reduce((sum, item) => sum + Number(item.metrics.uniqueUsers || 0), 0);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="rounded-3xl border border-gray-200 bg-gray-50/70 p-5 dark:border-gray-800 dark:bg-gray-900/60">
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">By gender</div>
        <div className="mt-4 space-y-3">
          {data.byGender.map((item) => (
            <div key={String(item.gender)}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium">{item.gender ? titleCase(item.gender) : "Unknown"}</span>
                <span className="text-gray-500 dark:text-gray-400">
                  {integer(Number(item.metrics.uniqueUsers || 0))} • {percent(Number(item.metrics.uniqueUsers || 0), genderTotal)}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white dark:bg-gray-950">
                <div className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-blue-500" style={{ width: `${Math.max(4, genderTotal ? (Number(item.metrics.uniqueUsers || 0) / genderTotal) * 100 : 0)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-gray-50/70 p-5 dark:border-gray-800 dark:bg-gray-900/60">
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">By age band</div>
        <div className="mt-4 space-y-3">
          {data.byAgeBand.map((item) => (
            <div key={item.ageBand}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium">{titleCase(item.ageBand)}</span>
                <span className="text-gray-500 dark:text-gray-400">
                  {integer(Number(item.metrics.uniqueUsers || 0))} • {percent(Number(item.metrics.uniqueUsers || 0), ageTotal)}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white dark:bg-gray-950">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500" style={{ width: `${Math.max(4, ageTotal ? (Number(item.metrics.uniqueUsers || 0) / ageTotal) * 100 : 0)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


function buildInsights(data: AnalyticsData) {
  const totalViews = Number(data.headline.totals.workViews || 0) + Number(data.headline.totals.chapterViews || 0);
  const bookmarks = Number(data.headline.totals.bookmarkAdds || 0);
  const comments = Number(data.headline.totals.commentsCreated || 0);
  const searches = Number(data.headline.totals.searches || 0);
  const zeroResults = data.topSearches.reduce((sum, item) => sum + Number(item.zeroResultCount || 0), 0);
  return [
    {
      label: "Bookmark conversion",
      value: `${totalViews ? ((bookmarks / totalViews) * 100).toFixed(1) : "0.0"}%`,
      hint: `${integer(bookmarks)} bookmarks from ${integer(totalViews)} total content views`,
    },
    {
      label: "Comment conversion",
      value: `${totalViews ? ((comments / totalViews) * 100).toFixed(1) : "0.0"}%`,
      hint: `${integer(comments)} comments from the same reading volume`,
    },
    {
      label: "Search zero-result rate",
      value: `${searches ? Math.round((zeroResults / searches) * 100) : 0}%`,
      hint: `${integer(zeroResults)} searches returned no results`,
    },
    {
      label: "Avg daily active",
      value: compact(
        data.overviewSeries.length
          ? data.overviewSeries.reduce((sum, row) => sum + Number(row.activeUsers || 0), 0) / data.overviewSeries.length
          : 0,
      ),
      hint: `${data.overviewSeries.length || 0} day buckets in the selected range`,
    },
  ];
}

export default function AdminAnalyticsDashboard({ data }: Props) {
  const { headline, topWorks, topGenres, topCreators, topSearches, demographics } = data;
  const limit = Math.max(topWorks.length, topGenres.length, topCreators.length, topSearches.length, 10);
  const rangeStart = data.range.start;
  const rangeEnd = data.range.end;
  const hasCustomRange = Boolean(rangeStart && rangeEnd);

  return (
    <div className="mt-8 space-y-6">
      <section className="rounded-[30px] border border-gray-200 bg-gradient-to-br from-gray-50 via-white to-blue-50 p-5 shadow-sm dark:border-gray-800 dark:from-gray-950 dark:via-gray-950 dark:to-blue-950/20 md:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Range active</div>
            <div className="mt-2 text-2xl font-black tracking-tight md:text-3xl">
              {formatDate(data.range.start)} — {formatDate(data.range.end)}
            </div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Choose a quick preset or a custom range to read traffic and engagement patterns.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {[7, 30, 90].map((days) => (
              <Link
                key={days}
                href={rangeQuery({ days, limit })}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-semibold transition",
                  !hasCustomRange && data.range.days === days
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-gray-300 hover:bg-white dark:border-gray-700 dark:hover:bg-gray-900"
                )}
              >
                {days}D
              </Link>
            ))}
          </div>
        </div>

        <form className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_120px_auto]">
          <label className="text-sm font-medium">
            <div className="mb-2 text-gray-600 dark:text-gray-300">Start</div>
            <input
              type="date"
              name="start"
              defaultValue={rangeStart}
              className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 outline-none ring-0 transition focus:border-blue-500 dark:border-gray-700 dark:bg-gray-950"
            />
          </label>
          <label className="text-sm font-medium">
            <div className="mb-2 text-gray-600 dark:text-gray-300">End</div>
            <input
              type="date"
              name="end"
              defaultValue={rangeEnd}
              className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 outline-none ring-0 transition focus:border-blue-500 dark:border-gray-700 dark:bg-gray-950"
            />
          </label>
          <label className="text-sm font-medium">
            <div className="mb-2 text-gray-600 dark:text-gray-300">Top rows</div>
            <select
              name="limit"
              defaultValue={String(limit)}
              className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 dark:border-gray-700 dark:bg-gray-950"
            >
              {[5, 10, 15, 20].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button className="w-full rounded-2xl bg-gray-900 px-5 py-3 text-sm font-bold text-white hover:opacity-90 dark:bg-white dark:text-gray-900">
              Apply filter
            </button>
          </div>
        </form>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-200">Included accounts</div>
          <div className="mt-3 text-3xl font-black tracking-tight">{compact(Number(data.dataQuality.includedAccounts || 0))}</div>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">Non-admin accounts counted in the active range.</div>
        </div>
        <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-5 dark:border-rose-900/40 dark:bg-rose-950/20">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700 dark:text-rose-200">Excluded admin accounts</div>
          <div className="mt-3 text-3xl font-black tracking-tight">{compact(Number(data.dataQuality.excludedAdminAccounts || 0))}</div>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">Admin activity is excluded from the analytics aggregate.</div>
        </div>
        <div className="rounded-3xl border border-blue-200 bg-blue-50/70 p-5 dark:border-blue-900/40 dark:bg-blue-950/20">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-200">Audit view</div>
          <div className="mt-3 text-lg font-black tracking-tight">See detail</div>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">Open details to see which accounts are counted and which admin accounts are excluded.</div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {buildInsights(data).map((item) => (
          <div key={item.label} className="rounded-3xl border border-blue-100 bg-blue-50/70 p-5 dark:border-blue-900/40 dark:bg-blue-950/20">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-200">{item.label}</div>
            <div className="mt-3 text-3xl font-black tracking-tight">{item.value}</div>
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">{item.hint}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="DAU" value={compact(headline.dau)} tone="blue" hint={`${integer(headline.dailyVisitors)} unique visitors today`} />
        <StatCard label="WAU" value={compact(headline.wau)} tone="violet" hint="Users active in the last 7 days" />
        <StatCard label="MAU" value={compact(headline.mau)} tone="emerald" hint="Users active in the last 30 days" />
        <StatCard label="New users" value={compact(Number(headline.totals.newUsers || 0))} tone="rose" hint={`${integer(Number(headline.totals.searches || 0))} searches in this range`} />
        <StatCard label="Work views" value={compact(Number(headline.totals.workViews || 0))} tone="blue" />
        <StatCard label="Chapter views" value={compact(Number(headline.totals.chapterViews || 0))} tone="violet" />
        <StatCard label="Bookmarks" value={compact(Number(headline.totals.bookmarkAdds || 0))} tone="emerald" />
        <StatCard label="Comments" value={compact(Number(headline.totals.commentsCreated || 0))} tone="rose" />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <ChartCard title="Traffic trend" subtitle="Unique visitors and active users per day.">
          <TrendChart data={data.overviewSeries} />
        </ChartCard>

        <ChartCard title="Engagement mix" subtitle="Overall performance of the primary interactions in the active range.">
          <TotalsBars totals={headline.totals} />
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <ChartCard title="Top works" subtitle="The busiest content based on total views in the active range.">
          <TopWorksTable items={topWorks} />
        </ChartCard>

        <ChartCard title="Top genres" subtitle="Genres attracting the most readers.">
          <SimpleRankList
            items={topGenres.map((item) => ({
              label: item.genre.name,
              sublabel: `${compact(item.metrics.uniqueViewers)} viewers • ${compact(item.metrics.bookmarkAdds)} bookmarks`,
              value: item.metrics.workViews,
              extra: item.metrics.ratingsCount ? `Avg rating ${item.metrics.ratingAvg.toFixed(1)}` : undefined,
            }))}
            valueLabel="views"
          />
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Top creators" subtitle="Creators with the highest reach and engagement.">
          <SimpleRankList
            items={topCreators.map((item) => ({
              label: item.creator.name || item.creator.username || "Unknown creator",
              sublabel: item.creator.username ? `@${item.creator.username}` : "No username",
              value: item.metrics.uniqueViewers,
              extra: `${compact(item.metrics.workViews)} work views • ${compact(item.metrics.followersGained)} follows`,
            }))}
            valueLabel="reach"
          />
        </ChartCard>

        <ChartCard title="Search insights" subtitle="The most frequently used queries and how effective their results are.">
          <SimpleRankList
            items={topSearches.map((item) => ({
              label: item.query,
              sublabel: `${titleCase(item.searchType)} • ${compact(item.clickCount)} clicks`,
              value: item.count,
              extra: `${compact(item.zeroResultCount)} zero result`,
            }))}
            valueLabel="searches"
          />
        </ChartCard>
      </div>

      <ChartCard title="Audience profile" subtitle="User breakdown by gender and age band for the active range.">
        <DemographicSection data={demographics} />
      </ChartCard>
    </div>
  );
}

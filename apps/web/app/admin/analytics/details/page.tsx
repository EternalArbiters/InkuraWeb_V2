import Link from "next/link";
import BackButton from "@/app/components/BackButton";
import { getAdminAnalyticsDetailData } from "@/server/services/admin/analytics";

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

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(new Date(value));
}

function compact(value: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(Number(value || 0));
}

function titleCase(value: string | null | undefined) {
  if (!value) return "Unknown";
  return value
    .toLowerCase()
    .split(/[_\s-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function identityLabel(user: { username?: string | null; name?: string | null; email?: string | null } | null | undefined) {
  if (!user) return "Guest / anonymous";
  return user.name || (user.username ? `@${user.username}` : null) || user.email || "Unknown user";
}

function eventSummary(eventTypes: Record<string, number>) {
  return Object.entries(eventTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([eventType, count]) => `${titleCase(eventType)} (${count})`)
    .join(" • ");
}

function SummaryCard({ label, value, hint, tone }: { label: string; value: string; hint: string; tone: string }) {
  return (
    <div className={`rounded-3xl border p-5 ${tone}`}>
      <div className="text-xs font-semibold uppercase tracking-[0.18em]">{label}</div>
      <div className="mt-3 text-3xl font-black tracking-tight">{value}</div>
      <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">{hint}</div>
    </div>
  );
}

export default async function AdminAnalyticsDetailsPage({ searchParams: searchParamsPromise }: Props) {
  const searchParams = (await searchParamsPromise) || {};
  const start = first(searchParams.start) || undefined;
  const end = first(searchParams.end) || undefined;
  const days = first(searchParams.days);
  const limit = first(searchParams.limit);

  const data = await getAdminAnalyticsDetailData({
    start,
    end,
    days: days ? Number(days) : undefined,
    limit: limit ? Number(limit) : undefined,
  });

  const backHref = `/admin/analytics?start=${data.range.start}&end=${data.range.end}&limit=${Math.max(Number(limit || 50), 10)}`;

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200">
              Analytics detail
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Included accounts and excluded admin activity</h1>
            <p className="mt-2 max-w-3xl text-sm text-gray-600 dark:text-gray-300 md:text-base">
              Range aktif {formatDate(data.range.start)} — {formatDate(data.range.end)}. Halaman ini nunjukin akun non-admin yang ikut dihitung, guest session anonim, dan akun admin yang dikeluarkan dari analytics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={backHref}
              className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              Back to dashboard
            </Link>
            <BackButton href="/admin/analytics" />
          </div>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Included events" value={compact(data.summary.includedEventsTotal)} hint="Semua event yang benar-benar dipakai analytics setelah admin difilter keluar." tone="border-blue-200 bg-blue-50/70 text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-200" />
          <SummaryCard label="Included accounts" value={compact(data.summary.includedAccounts)} hint="Akun user non-admin yang punya event di range ini." tone="border-emerald-200 bg-emerald-50/70 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-200" />
          <SummaryCard label="Guest sessions" value={compact(data.summary.guestSessions)} hint="Visitor anonim tanpa akun yang tetap masuk sebagai traffic publik." tone="border-violet-200 bg-violet-50/70 text-violet-700 dark:border-violet-900/40 dark:bg-violet-950/20 dark:text-violet-200" />
          <SummaryCard label="Excluded admin events" value={compact(data.summary.excludedAdminEventsTotal)} hint="Event admin yang sengaja dikeluarkan dari analytics utama." tone="border-rose-200 bg-rose-50/70 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-200" />
        </section>

        <section className="mt-8 rounded-[28px] border border-gray-200 bg-white/90 p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900/80 md:p-6">
          <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-lg font-bold md:text-xl">Included accounts</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">Akun ini masuk ke pendataan analytics utama.</p>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{data.includedAccounts.length} accounts</div>
          </div>

          <div className="mt-5 overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-800">
            <div className="grid grid-cols-[minmax(0,1.4fr)_120px_180px_180px] gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
              <div>Account</div>
              <div>Events</div>
              <div>First seen</div>
              <div>Last seen</div>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {data.includedAccounts.length ? data.includedAccounts.map((item, index) => (
                <div key={item.user?.id || item.lastSeenAt || `included-${index}`} className="grid grid-cols-[minmax(0,1.4fr)_120px_180px_180px] gap-3 px-4 py-4 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-bold">{identityLabel(item.user)}</div>
                    <div className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                      {item.user?.email || "No email"}{item.user?.username ? ` • @${item.user.username}` : ""}
                    </div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{eventSummary(item.eventTypes)}</div>
                  </div>
                  <div className="font-semibold">{compact(item.totalEvents)}</div>
                  <div>{formatDateTime(item.firstSeenAt)}</div>
                  <div>{formatDateTime(item.lastSeenAt)}</div>
                </div>
              )) : (
                <div className="px-4 py-8 text-sm text-gray-500 dark:text-gray-400">Belum ada akun non-admin yang tercatat di range ini.</div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[28px] border border-gray-200 bg-white/90 p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900/80 md:p-6">
          <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-lg font-bold md:text-xl">Excluded admin accounts</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">Akun admin yang terdeteksi tetapi tidak dipakai dalam aggregate utama.</p>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{data.excludedAdminAccounts.length} accounts</div>
          </div>

          <div className="mt-5 overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-800">
            <div className="grid grid-cols-[minmax(0,1.4fr)_120px_180px_180px] gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
              <div>Admin account</div>
              <div>Events</div>
              <div>First seen</div>
              <div>Last seen</div>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {data.excludedAdminAccounts.length ? data.excludedAdminAccounts.map((item, index) => (
                <div key={item.user?.id || item.lastSeenAt || `excluded-${index}`} className="grid grid-cols-[minmax(0,1.4fr)_120px_180px_180px] gap-3 px-4 py-4 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-bold">{identityLabel(item.user)}</div>
                    <div className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                      {item.user?.email || "No email"}{item.user?.username ? ` • @${item.user.username}` : ""}
                    </div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{eventSummary(item.eventTypes)}</div>
                  </div>
                  <div className="font-semibold">{compact(item.totalEvents)}</div>
                  <div>{formatDateTime(item.firstSeenAt)}</div>
                  <div>{formatDateTime(item.lastSeenAt)}</div>
                </div>
              )) : (
                <div className="px-4 py-8 text-sm text-gray-500 dark:text-gray-400">Belum ada aktivitas admin yang perlu dikecualikan di range ini.</div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[28px] border border-gray-200 bg-white/90 p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900/80 md:p-6">
          <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-lg font-bold md:text-xl">Recent included events</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">Sample event terbaru yang dipakai analytics setelah admin disaring keluar.</p>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Showing {data.recentIncludedEvents.length} latest events</div>
          </div>

          <div className="mt-5 overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-800">
            <div className="grid grid-cols-[180px_150px_minmax(0,1fr)_200px] gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
              <div>Time</div>
              <div>Event</div>
              <div>Path</div>
              <div>Account</div>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {data.recentIncludedEvents.length ? data.recentIncludedEvents.map((item) => (
                <div key={item.id} className="grid grid-cols-[180px_150px_minmax(0,1fr)_200px] gap-3 px-4 py-4 text-sm">
                  <div>{formatDateTime(item.occurredAt)}</div>
                  <div className="font-semibold">{titleCase(item.eventType)}</div>
                  <div className="truncate text-gray-600 dark:text-gray-300">{item.path || item.sessionKey || "—"}</div>
                  <div className="truncate">{identityLabel(item.user)}</div>
                </div>
              )) : (
                <div className="px-4 py-8 text-sm text-gray-500 dark:text-gray-400">Belum ada event yang bisa ditampilkan untuk range ini.</div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

import * as React from "react";

import AnalyticsEventTracker from "@/app/components/analytics/AnalyticsEventTracker";
import AnalyticsTrackedLink from "@/app/components/analytics/AnalyticsTrackedLink";
import { parseUserSearchParams, searchUsers, type UserSearchScope } from "@/server/services/search/userSearch";

export const dynamic = "force-dynamic";

function scopeLabel(scope: UserSearchScope) {
  if (scope === "authors") return "Authors";
  if (scope === "translators") return "Translators";
  return "Users";
}

function scopeDescription(scope: UserSearchScope) {
  if (scope === "authors") return "Search author accounts by username or profile name.";
  if (scope === "translators") return "Search translator accounts by username or profile name.";
  return "Search all public accounts by username or profile name.";
}

function joinedLabel(input: Date | string) {
  const date = input instanceof Date ? input : new Date(input);
  return date.toLocaleDateString(undefined, { year: "numeric", month: "long" });
}

function avatarInitial(name: string) {
  const trimmed = name.trim();
  return trimmed ? trimmed[0]?.toUpperCase() : "U";
}

function RoleChip({ tone, children }: { tone: "blue" | "purple" | "amber" | "gray"; children: React.ReactNode }) {
  const toneClass =
    tone === "blue"
      ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200"
      : tone === "purple"
      ? "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900 dark:bg-purple-950/40 dark:text-purple-200"
      : tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
      : "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-950/40 dark:text-gray-200";

  return <span className={`rounded-full border px-2.5 py-1 font-semibold ${toneClass}`}>{children}</span>;
}

function UserCard({ user }: { user: Awaited<ReturnType<typeof searchUsers>>["users"][number] & { analyticsEvent?: Record<string, unknown> | null } }) {
  const displayName = (user.name && user.name.trim()) || user.username;
  const focusX = Number.isFinite(Number(user.avatarFocusX)) ? Number(user.avatarFocusX) : 50;
  const focusY = Number.isFinite(Number(user.avatarFocusY)) ? Number(user.avatarFocusY) : 50;
  const zoom = Number.isFinite(Number(user.avatarZoom)) ? Math.max(1, Number(user.avatarZoom)) : 1;
  const hasRole = user.originalWorksCount > 0 || user.translationWorksCount > 0 || user.reuploadWorksCount > 0;

  return (
    <AnalyticsTrackedLink
      href={`/u/${user.username}`}
      analyticsEvent={user.analyticsEvent ?? null}
      className="rounded-2xl border border-gray-200 bg-white/70 p-4 transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50 dark:hover:bg-gray-900"
    >
      <div className="flex items-start gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-800">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt={displayName}
              className="h-full w-full object-cover"
              style={{
                objectPosition: `${focusX}% ${focusY}%`,
                transform: `scale(${zoom})`,
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xl font-extrabold text-gray-700 dark:text-gray-200">
              {avatarInitial(displayName)}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-lg font-extrabold tracking-tight text-gray-900 dark:text-white">{displayName}</div>
          <div className="mt-1 truncate text-sm text-gray-600 dark:text-gray-300">@{user.username}</div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {user.originalWorksCount > 0 ? <RoleChip tone="blue">Author · {user.originalWorksCount}</RoleChip> : null}
            {user.translationWorksCount > 0 ? <RoleChip tone="purple">Translator · {user.translationWorksCount}</RoleChip> : null}
            {user.reuploadWorksCount > 0 ? <RoleChip tone="amber">Reuploader · {user.reuploadWorksCount}</RoleChip> : null}
            {!hasRole ? <RoleChip tone="gray">User</RoleChip> : null}
          </div>
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">Joined {joinedLabel(user.createdAt)}</div>
        </div>
      </div>
    </AnalyticsTrackedLink>
  );
}

export default async function UserSearchPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ q?: string | string[]; scope?: string | string[] }>;
}) {
  const raw = await searchParamsPromise;
  const parsed = parseUserSearchParams(raw);
  const data = await searchUsers(parsed);

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Search {scopeLabel(data.scope)}</h1>
        <p className="mt-2 max-w-3xl text-sm text-gray-600 dark:text-gray-300 md:text-base">
          {scopeDescription(data.scope)}
        </p>

        <form action="/search/users" method="get" className="mt-6 grid gap-3 md:grid-cols-[180px_1fr_140px]">
          <select
            name="scope"
            defaultValue={data.scope}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900"
          >
            <option value="all">Users</option>
            <option value="authors">Authors</option>
            <option value="translators">Translators</option>
          </select>

          <input
            name="q"
            defaultValue={data.q}
            placeholder="Search username / name"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-800 dark:bg-gray-900"
          />

          <button className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 py-3 font-semibold text-white hover:brightness-110">
            Search
          </button>
        </form>

        {data.q ? (
          <AnalyticsEventTracker
            eventType="SEARCH_SUBMIT"
            payload={{
              path: "/search/users",
              routeName: "search.users",
              searchQuery: data.q,
              searchType: data.scope,
              resultCount: data.users.length,
            }}
          />
        ) : null}

        <div className="mt-6 text-sm text-gray-600 dark:text-gray-300">
          {data.q ? (
            <>
              {data.users.length} results for <span className="font-semibold text-gray-900 dark:text-white">“{data.q}”</span>
            </>
          ) : (
            <>{data.users.length} result</>
          )}
        </div>

        {data.users.length ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {data.users.map((user, index) => (
              <UserCard
                key={user.id}
                user={{
                  ...user,
                  analyticsEvent: data.q
                    ? {
                        eventType: "SEARCH_RESULT_CLICK",
                        searchQuery: data.q,
                        searchType: data.scope,
                        metadata: { clickedUserId: user.id, position: index + 1 },
                      }
                    : null,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-gray-200 bg-white/70 p-6 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-300">
            No matching results yet.
          </div>
        )}
      </div>
    </main>
  );
}

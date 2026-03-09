import Link from "next/link";
import { parseUserSearchParams, searchUsers, type UserSearchScope } from "@/server/services/search/userSearch";

export const dynamic = "force-dynamic";

function scopeLabel(scope: UserSearchScope) {
  if (scope === "authors") return "Authors";
  if (scope === "translators") return "Translators";
  return "Users";
}

function scopeDescription(scope: UserSearchScope) {
  if (scope === "authors") return "Search account author berdasarkan username atau nama profil.";
  if (scope === "translators") return "Search account translator berdasarkan username atau nama profil.";
  return "Search semua akun publik berdasarkan username atau nama profil.";
}

function joinedLabel(input: Date | string) {
  const date = input instanceof Date ? input : new Date(input);
  return date.toLocaleDateString(undefined, { year: "numeric", month: "long" });
}

function avatarInitial(name: string) {
  const trimmed = name.trim();
  return trimmed ? trimmed[0]?.toUpperCase() : "U";
}

function UserCard({ user }: { user: Awaited<ReturnType<typeof searchUsers>>["users"][number] }) {
  const displayName = (user.name && user.name.trim()) || user.username;
  const focusX = Number.isFinite(Number(user.avatarFocusX)) ? Number(user.avatarFocusX) : 50;
  const focusY = Number.isFinite(Number(user.avatarFocusY)) ? Number(user.avatarFocusY) : 50;
  const zoom = Number.isFinite(Number(user.avatarZoom)) ? Math.max(1, Number(user.avatarZoom)) : 1;

  return (
    <Link
      href={`/u/${user.username}`}
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
            {user.publishedWorksCount > 0 ? (
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
                Author · {user.publishedWorksCount}
              </span>
            ) : null}
            {user.translatedWorksCount > 0 ? (
              <span className="rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 font-semibold text-purple-700 dark:border-purple-900 dark:bg-purple-950/40 dark:text-purple-200">
                Translator · {user.translatedWorksCount}
              </span>
            ) : null}
            {user.publishedWorksCount === 0 && user.translatedWorksCount === 0 ? (
              <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 font-semibold text-gray-700 dark:border-gray-800 dark:bg-gray-950/40 dark:text-gray-200">
                User
              </span>
            ) : null}
          </div>
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">Joined {joinedLabel(user.createdAt)}</div>
        </div>
      </div>
    </Link>
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

        <div className="mt-6 text-sm text-gray-600 dark:text-gray-300">
          {data.q ? (
            <>
              {data.users.length} result untuk <span className="font-semibold text-gray-900 dark:text-white">“{data.q}”</span>
            </>
          ) : (
            <>{data.users.length} result</>
          )}
        </div>

        {data.users.length ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {data.users.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-gray-200 bg-white/70 p-6 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-300">
            Belum ada hasil yang cocok.
          </div>
        )}
      </div>
    </main>
  );
}

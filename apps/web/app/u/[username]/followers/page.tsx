import Link from "next/link";
import { notFound } from "next/navigation";
import ConnectionUserCard from "@/app/components/user/ConnectionUserCard";
import { getPublicConnectionsPageData } from "@/server/services/profile/follows";
import LoadMoreList from "@/app/components/LoadMoreList";

export const dynamic = "force-dynamic";

export default async function PublicFollowersPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const data = await getPublicConnectionsPageData(username, "followers");
  if (!data) return notFound();

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Followers</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Accounts following @{data.user.username}.</p>
          </div>
          <Link href={`/u/${data.user.username}`} className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">Back</Link>
        </div>

        {data.items.length ? (
          <LoadMoreList className="mt-6 grid gap-3">
            {data.items.map((item) => (
              <ConnectionUserCard key={`${item.user.id}-${item.createdAt}`} user={item.user} />
            ))}
          </LoadMoreList>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-gray-300 p-6 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-300">
            No followers yet.
          </div>
        )}
      </div>
    </main>
  );
}

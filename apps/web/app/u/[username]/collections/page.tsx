import Link from "next/link";
import { notFound } from "next/navigation";

import CollectionRailCard from "@/app/components/user/CollectionRailCard";
import { getPublicCollectionsPageData } from "@/server/services/profile/publicProfilePage";

export const dynamic = "force-dynamic";

export default async function PublicCollectionsPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const data = await getPublicCollectionsPageData(username);

  if (!data) {
    notFound();
  }

  const displayName = data.user.name || `@${data.user.username}`;

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Collections</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Public collections shared by {displayName}.</p>
          </div>
          <Link
            href={`/u/${data.user.username}`}
            className="inline-flex items-center justify-center rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            Back to Profile
          </Link>
        </div>

        {data.visibleLists.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-gray-300 dark:border-gray-800 p-6 text-sm text-gray-600 dark:text-gray-300">
            No collections yet.
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {data.visibleLists.map((list) => (
              <CollectionRailCard
                key={list.id}
                href={`/lists/${list.slug}`}
                title={list.title}
                description={list.description}
                itemCount={Number(list.itemCount || list._count?.items || 0)}
                items={Array.isArray(list.items) ? list.items : []}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

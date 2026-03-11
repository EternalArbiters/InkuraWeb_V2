import Link from "next/link";

import ProfileCommentCard from "@/app/components/user/ProfileCommentCard";
import ProfileSortSelect from "@/app/components/user/ProfileSortSelect";
import { requirePageUserId } from "@/server/auth/pageAuth";
import { getViewerComments } from "@/server/services/profile/viewerActivity";

export const dynamic = "force-dynamic";

const COMMENT_SORT_OPTIONS = [
  { value: "top", label: "Top" },
  { value: "bottom", label: "Bottom" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
] as const;

export default async function ProfileCommentsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const userId = await requirePageUserId("/profile/comments");
  const resolvedSearchParams = (await searchParams) || {};
  const rawSort = Array.isArray(resolvedSearchParams.sort) ? resolvedSearchParams.sort[0] : resolvedSearchParams.sort;
  const { items, total, sort } = await getViewerComments(userId, { sort: rawSort, take: 100 });

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/profile" className="text-sm font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
              ← Back to profile
            </Link>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight">All Comments</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{total} comment{total === 1 ? "" : "s"} on your profile.</p>
          </div>
          <ProfileSortSelect value={sort} label="Sort comments" options={[...COMMENT_SORT_OPTIONS]} />
        </div>

        {items.length ? (
          <div className="mt-6 grid gap-3">
            {items.map((comment) => (
              <ProfileCommentCard key={comment.id} comment={comment} />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-gray-300 p-6 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-300">
            No comments yet.
          </div>
        )}
      </div>
    </main>
  );
}
